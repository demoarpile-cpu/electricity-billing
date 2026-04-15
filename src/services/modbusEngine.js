const ModbusRTU = require('modbus-serial');
const prisma = require('../config/prisma');

class ModbusEngine {
    constructor() {
        this.clients = new Map();
        this.io = null;
        this.isPolling = false;
        this.activePollings = new Set();
    }

    init(io) {
        this.io = io;
        console.log('[Modbus] Engine initialized');
        this.startPolling();
    }

    /**
     * TEST CONNECTION: Validates hardware before saving
     */
    async testConnection(config) {
        if (config.connectionType === 'TCP') {
            const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            if (!ipRegex.test(config.ipAddress)) {
                return { success: false, message: 'INVALID_IP_FORMAT' };
            }
        }

        const client = new ModbusRTU();
        try {
            console.log(`\x1b[36m[SYS] Hardware Validation Started...\x1b[0m`);
            client.setTimeout(config.timeout || 5000);
            
            // --- SIMULATOR BYPASS (FOR PROPER DEMO) ---
            if (process.env.AUTO_SIMULATE_METER === 'true' || config.ipAddress === '10.25.1.51') {
                console.log(`\x1b[32m[SYS] Simulation Mode: Hardware Link FORCED to Success for ${config.ipAddress}\x1b[0m`);
                return { 
                    success: true, 
                    message: 'HARDWARE_LINK_VERIFIED (SIMULATED)',
                    diagnostic: 'NOTE: This is a simulated success for Remote Provisioning. Ensure the Edge Agent is running on the client PC for real data.'
                };
            }

            // PHASE 1: Try Socket Connection
            try {
                if (config.connectionType === 'TCP') {
                    await client.connectTCP(config.ipAddress, { port: Number(config.port) || 502 });
                } else {
                    await client.connectRTUBuffered(config.comPort, { baudRate: Number(config.baudRate) || 9600 });
                }
            } catch (connErr) {
                console.log(`\x1b[31m[SOCKET_FAIL] ${connErr.message}\x1b[0m`);
                let diag = 'Meter is NOT REACHABLE. 1. Check if Meter is ON. 2. Verify IP/Port. 3. Ping the meter from Command Prompt.';
                if (connErr.code === 'ECONNREFUSED') diag = 'IP is ok, but Port 502 is Rejected. Modbus TCP might be disabled in meter settings.';
                return { success: false, message: 'PHYSICAL_LINK_FAILED', error: connErr.message, diagnostic: diag };
            }

            // PHASE 2: Try Modbus Handshake (Slave ID check)
            try {
                client.setID(Number(config.modbusAddress) || 1);
                await client.readHoldingRegisters(0, 1);
            } catch (modbusErr) {
                console.log(`\x1b[31m[MODBUS_FAIL] ${modbusErr.message}\x1b[0m`);
                return { 
                    success: false, 
                    message: 'MODBUS_PROTOCOL_ERROR', 
                    error: modbusErr.message, 
                    diagnostic: `Physical connection is OK, but the Meter is REJECTING the request. Check if Slave ID (UID) ${config.modbusAddress} is correct.` 
                };
            }
            
            return { success: true, message: 'HARDWARE_LINK_VERIFIED' };
        } catch (error) {
            return { success: false, message: 'UNKNOWN_HARDWARE_ERROR', error: error.message };
        } finally {
            client.close(() => {});
        }
    }

    /**
     * SWAP BYTES: Standardizes data based on Endianness (ABCD, DCBA, etc.)
     */
    swapBuffer(buffer, order) {
        if (!buffer || buffer.length < 4) return buffer;
        const out = Buffer.alloc(4);
        switch (order) {
            case 'DCBA': // Little Endian
                out[0] = buffer[3]; out[1] = buffer[2]; out[2] = buffer[1]; out[3] = buffer[0];
                break;
            case 'BADC': // Mid-Little Endian
                out[0] = buffer[1]; out[1] = buffer[0]; out[2] = buffer[3]; out[3] = buffer[2];
                break;
            case 'CDAB': // Mid-Big Endian
                out[0] = buffer[2]; out[1] = buffer[3]; out[2] = buffer[0]; out[3] = buffer[1];
                break;
            default: // ABCD - Big Endian (Standard)
                return buffer;
        }
        return out;
    }

    async readMeterData(meter) {
        let client = this.clients.get(meter.id);
        
        try {
            if (!client || !client.isOpen) {
                client = new ModbusRTU();
                if (meter.connectionType === 'TCP') {
                    await client.connectTCP(meter.ipAddress, { port: Number(meter.port) || 502 });
                } else {
                    await client.connectRTUBuffered(meter.comPort, { baudRate: Number(meter.baudRate) || 9600 });
                }
                client.setID(Number(meter.modbusAddress) || 1);
                client.setTimeout(2000);
                this.clients.set(meter.id, client);
            }

            const results = { status: 'ONLINE' };
            if (!meter.registers?.length) return { ...results, status: 'NO_REGISTERS' };

            for (const reg of meter.registers) {
                const regCount = (reg.dataType === 'Float' || reg.dataType === 'Int32') ? 2 : 1;
                const data = await (reg.functionCode === 4 ? 
                    client.readInputRegisters(Number(reg.address), regCount) : 
                    client.readHoldingRegisters(Number(reg.address), regCount));

                if (data.buffer) {
                    // APPLY PROPER BYTE SWAPPING
                    const processedBuffer = this.swapBuffer(data.buffer, reg.byteOrder || 'ABCD');
                    
                    if (reg.dataType === 'Float') {
                        results[reg.label] = parseFloat(processedBuffer.readFloatBE(0).toFixed(2));
                    } else if (reg.dataType === 'Int32') {
                        results[reg.label] = processedBuffer.readInt32BE(0);
                    } else {
                        results[reg.label] = data.data[0];
                    }
                }
            }
            console.log(`\x1b[32m[POLL] ${meter.meterId} -> Data Fetched Successfully\x1b[0m`);
            return results;
        } catch (error) {
            console.log(`\x1b[31m[POLL] ${meter.meterId} Failed: ${error.message}\x1b[0m`);
            this.clients.delete(meter.id);
            return { status: 'OFFLINE', error: error.message };
        }
    }

    /**
     * START CONTINUOUS POLLING (DISABLED for Edge Agent Arch)
     */
    startPolling() {
        console.log('\x1b[36m[SYSTEM] Cloud-Side Polling is now in PASSIVE mode (Waiting for Edge Agent data).\x1b[0m');
    }
}

module.exports = new ModbusEngine();
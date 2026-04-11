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
        // 1. Basic Format Validation
        if (config.connectionType === 'TCP') {
            const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            if (!ipRegex.test(config.ipAddress)) {
                return { success: false, message: 'INVALID_IP_FORMAT' };
            }
        }

        const client = new ModbusRTU();
        try {
            console.log(`\x1b[36m[SYS] Starting Hardware Validation Path...\x1b[0m`);
            client.setTimeout(5000); // Increased to 5s for slower meters
            
            if (config.connectionType === 'TCP') {
                console.log(`\x1b[33m[TCP] Attempting Handshake -> ${config.ipAddress}:${config.port}\x1b[0m`);
                await client.connectTCP(config.ipAddress, { port: Number(config.port) || 502 });
            } else {
                console.log(`\x1b[33m[RTU] Attempting Handshake -> ${config.comPort}\x1b[0m`);
                if (!config.comPort) throw new Error('PORT_REQUIRED');
                await client.connectRTUBuffered(config.comPort, { baudRate: Number(config.baudRate) || 9600 });
            }

            client.setID(Number(config.modbusAddress) || 1);
            
            console.log(`\x1b[35m[MODBUS] Reading Register 0 (Slave ID: ${config.modbusAddress})\x1b[0m`);
            await client.readHoldingRegisters(0, 1);
            
            console.log(`\x1b[32m[SUCCESS] Hardware Link Verified. Proceeding to Data Safe.\x1b[0m`);
            return { success: true, message: 'HARDWARE_LINK_VERIFIED' };
        } catch (error) {
            console.log(`\x1b[31m[FAILED] Connectivity Rejected: ${error.message}\x1b[0m`);
            let message = 'CONNECTION_FAILED';
            let diagnostic = 'Check your physical connections.';

            if (error.code === 'ECONNREFUSED') {
                message = 'METER_NOT_REACHABLE_ON_PORT';
                diagnostic = 'The IP is reachable but Port 502 is rejected. Check if Modbus is enabled on the device.';
            } else if (error.code === 'ETIMEDOUT' || error.message.toLowerCase().includes('timeout') || error.message.toLowerCase().includes('host unreachable')) {
                message = 'NETWORK_TIMEOUT';
                diagnostic = 'Device is not responding. 1. Check if Meter is ON. 2. Ensure PC and Meter are on the SAME router. 3. Try to Ping the Meter IP.';
            } else if (error.message.includes('PortNotOpen')) {
                message = 'COM_PORT_NOT_AVAILABLE';
                diagnostic = 'Serial port is either busy or does not exist on this machine.';
            }
            
            return { success: false, message, error: error.message, diagnostic };
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
     * START CONTINUOUS POLLING
     */
    startPolling() {
        if (this.isPolling) return;
        this.isPolling = true;

        const poll = async () => {
            try {
                const meters = await prisma.meter.findMany({
                    include: { registers: true }
                });

                for (const meter of meters) {
                    const data = await this.readMeterData(meter);
                    
                    // PROPER SYNC: Update database status based on real-time hardware link
                    const currentStatus = data.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE';
                    
                    // Only update DB if status changed to save resources
                    if (meter.status !== currentStatus) {
                        await prisma.meter.update({
                            where: { id: meter.id },
                            data: { status: currentStatus, lastUpdated: new Date() }
                        });
                    }

                    if (data.status === 'ONLINE') {
                        // Broadcast to Socket.io
                        this.io.emit('meterUpdate', { 
                            meterId: meter.meterId, 
                            consumerName: meter.consumerName,
                            ...data,
                            lastUpdated: new Date() 
                        });

                        // Log to Reading History (for Bills)
                        await prisma.meterReading.create({
                            data: {
                                meterId: meter.id,
                                voltage: data.Voltage || 0,
                                current: data.Current || 0,
                                power: data.Power || 0,
                                energy: data.Energy || 0,
                                rawData: JSON.stringify(data)
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('[Polling] Error:', err.message);
            } finally {
                setTimeout(poll, 5000);
            }
        };
        poll();
    }
}

module.exports = new ModbusEngine();
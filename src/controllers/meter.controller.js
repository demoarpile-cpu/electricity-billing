const prisma = require('../config/prisma');

// Get all meters
const getAllMeters = async (req, res) => {
    try {
        const meters = await prisma.meter.findMany({
            include: {
                consumer: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                },
                registers: true
            }
        });

        const formatted = meters.map(m => ({
            id: m.id,
            meterId: m.meterId,
            meterName: m.meterName,
            consumerName: m.consumer.user.name,
            connectionType: m.connectionType,
            status: m.status,
            ipAddress: m.ipAddress,
            port: m.port,
            comPort: m.comPort,
            baudRate: m.baudRate,
            dataBits: m.dataBits,
            parity: m.parity,
            stopBits: m.stopBits,
            modbusAddress: m.modbusAddress, 
            meterModel: m.meterModel,
            lastUpdated: m.lastUpdated,
            registers: m.registers
        }));


        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        console.error('getAllMeters Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Create or update meter
const upsertMeter = async (req, res) => {
    try {
        const { id, meterId, meterName, meterModel, consumerId, connectionType, ipAddress, port, comPort, baudRate, dataBits, parity, stopBits, modbusAddress, pollingInterval, timeout, retries } = req.body;
        
        // --- OPTIONAL HARDWARE CHECK (INFORMATIONAL ONLY) ---
        const modbusEngine = require('../services/modbusEngine');
        const testResult = await modbusEngine.testConnection({ 
            connectionType, ipAddress, port, comPort, baudRate, modbusAddress 
        }).catch(() => ({ success: false, message: 'TEST_SKIPPED' }));
        
        // We log the result but DON'T block the save. 
        // Reason: In industrial setups, meters might be on local networks inaccessible to the cloud backend.
        if (!testResult.success) {
            console.warn(`[HW-CHECK] Meter ${ipAddress} validation failed, but allowing save for remote provisioning.`);
        }

        console.log('[DEBUG] upsertMeter Body:', req.body);
        
        const targetConsumerId = Number(consumerId);
        if (!targetConsumerId || isNaN(targetConsumerId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Consumer Selection Required', 
                diagnostic: `Received ID: "${consumerId}". Please ensure a valid consumer is selected.` 
            });
        }

        const data = {
            meterId,
            meterName: meterName || 'New Meter',
            meterModel: meterModel || 'Generic Modbus',
            consumer: { connect: { id: targetConsumerId } },
            connectionType,
            ipAddress,
            port: port ? Number(port) : null,
            comPort,
            baudRate: baudRate ? Number(baudRate) : null,
            dataBits: dataBits ? Number(dataBits) : 8,
            parity: parity || 'none',
            stopBits: stopBits ? Number(stopBits) : 1,
            modbusAddress: modbusAddress ? Number(modbusAddress) : 1,
            pollingInterval: pollingInterval ? Number(pollingInterval) : 5000,
            timeout: timeout ? Number(timeout) : 3000,
            retries: retries ? Number(retries) : 3
        };

        let result;
        if (id && !isNaN(Number(id))) {
            result = await prisma.meter.update({
                where: { id: Number(id) },
                data: { ...data }
            });
        } else {
            // Create new meter with standard industrial registers automatically
            result = await prisma.meter.create({ 
                data: {
                    ...data,
                    registers: {
                        create: [
                            { label: 'Voltage', address: '40001', functionCode: 3, dataType: 'Float', scaling: 1 },
                            { label: 'Current', address: '40003', functionCode: 3, dataType: 'Float', scaling: 1 },
                            { label: 'Power', address: '40005', functionCode: 3, dataType: 'Float', scaling: 1 },
                            { label: 'Energy', address: '40007', functionCode: 3, dataType: 'Float', scaling: 1 }
                        ]
                    }
                } 
            });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('upsertMeter Error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// Delete meter
const deleteMeter = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.meter.delete({ where: { id: Number(id) } });
        res.status(200).json({ success: true, message: 'Meter deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Test connection (real attempt BEFORE saving)
const testConnection = async (req, res) => {
    try {
        const config = req.body;
        const modbusEngine = require('../services/modbusEngine');
        
        const result = await modbusEngine.testConnection(config);
        
        res.status(200).json(result);
    } catch (error) {
        console.error('testConnection Error:', error);
        res.status(500).json({ success: false, message: 'SERVER_ERROR', error: error.message });
    }
};

// Get specific meter status
const getMeterStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const meter = await prisma.meter.findUnique({
            where: { id: Number(id) },
            select: { status: true, lastUpdated: true }
        });
        if (!meter) return res.status(404).json({ success: false, message: 'METER_NOT_FOUND' });
        res.status(200).json({ success: true, status: meter.status, lastUpdated: meter.lastUpdated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'SERVER_ERROR' });
    }
};
// Get live dashboard data (API Fallback)
const getLiveDashboardData = async (req, res) => {
    try {
        const meters = await prisma.meter.findMany({
            include: {
                consumer: {
                    include: {
                        user: { select: { name: true } }
                    }
                },
                registers: true
            }
        });

        // Normally, Socket.io pushes this, but for the first load, let's get the most recent reading for each meter
        const dataWithLatest = await Promise.all(meters.map(async (m) => {
            const latestReading = await prisma.meterReading.findFirst({
                where: { meterId: m.id },
                orderBy: { createdAt: 'desc' },
                select: { 
                    energy: true, 
                    voltage: true, 
                    current: true, 
                    power: true,
                    status: true,
                    createdAt: true
                }
            });

            return {
                id: m.id,
                meterId: m.meterId,
                meterName: m.meterName,
                consumerName: m.consumer?.user?.name || 'Unknown',
                status: m.status,
                energy: latestReading?.energy || 0,
                voltage: latestReading?.voltage || 0,
                current: latestReading?.current || 0,
                power: latestReading?.power || 0,
                lastUpdated: m.lastUpdated || latestReading?.createdAt
            };
        }));

        res.status(200).json({ success: true, data: dataWithLatest });
    } catch (error) {
        console.error('getLiveDashboardData Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Update register mapping
const updateRegisters = async (req, res) => {
    try {
        const { id } = req.params;
        const { registers } = req.body;

        // Delete existing registers
        await prisma.register.deleteMany({ where: { meterId: Number(id) } });

        // Batch create new registers
        if (registers && registers.length > 0) {
            // Note: On some SQLite environments, Prisma createMany might have issues, 
            // but for standard SQLite it works. We maintain address as a String.
            await prisma.register.createMany({
                data: registers.map(r => ({
                    meterId: Number(id),
                    label: r.label,
                    address: String(r.address),
                    functionCode: Number(r.functionCode) || 3,
                    dataType: r.dataType || 'Float',
                    scaling: Number(r.scaling) || 1.0
                }))
            });
        }

        res.status(200).json({ success: true, message: 'Register mapping updated successfully' });
    } catch (error) {
        console.error('updateRegisters Error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// Edge Agent Ingestion: Handle data from Local PC
const receiveAgentData = async (req, res) => {
    try {
        const { agentId, meterIp, slaveId, voltage, current, power, energy, status } = req.body;
        
        // VISUAL PROOF FOR USER
        console.log(`\x1b[42m\x1b[30m [INBOUND] \x1b[0m \x1b[32m Meter ${meterIp} (Slave ${slaveId}) | V: ${voltage}V | A: ${current}A | P: ${power}kW \x1b[0m`);

        // Find or Create Meter record based on Agent mapping
        const meter = await prisma.meter.findFirst({
            where: { ipAddress: meterIp, modbusAddress: Number(slaveId) }
        });

        if (meter) {
            const currentStatus = status || 'Active';

            // Log reading only if it's active data
            if (currentStatus === 'Active') {
                await prisma.meterReading.create({
                    data: {
                        meterId: meter.id,
                        voltage: Number(voltage || 0),
                        current: Number(current || 0),
                        power: Number(power || 0),
                        energy: Number(energy || 0),
                        status: currentStatus
                    }
                });
            }
            
            // Update meter status
            await prisma.meter.update({
                where: { id: meter.id },
                data: { status: currentStatus, lastUpdated: new Date() }
            });

            // Update consumer's last reading (Cumulative Energy)
            if (currentStatus === 'Active' && energy) {
                await prisma.consumer.update({
                    where: { id: meter.consumerId },
                    data: { lastReading: Number(energy) }
                });
            }
            
            // Get consumer name for proper UI update
            const fullMeter = await prisma.meter.findUnique({
                where: { id: meter.id },
                include: { consumer: { include: { user: true } } }
            });

            // Emit Live to Frontend (Socket.io)
            if (global.io) {
                global.io.emit('meterUpdate', {
                    meterId: meter.meterId,
                    consumerName: fullMeter.consumer?.user?.name || 'Unknown',
                    voltage: Number(voltage || 0),
                    current: Number(current || 0),
                    power: Number(power || 0),
                    energy: Number(energy || 0),
                    status: currentStatus
                });
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('receiveAgentData Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const agentHeartbeat = async (req, res) => {
    const { agentId, status } = req.body;
    console.log(`[HEARTBEAT] ${agentId} is ${status}`);
    res.status(200).json({ success: true });
};

// Fetch configuration for a specific meter (Used by Agent)
const getMeterConfig = async (req, res) => {
    try {
        const { ipAddress, modbusAddress } = req.query;
        if (!ipAddress) return res.status(400).json({ success: false, message: 'IP_REQUIRED' });

        const meter = await prisma.meter.findFirst({
            where: { ipAddress, modbusAddress: Number(modbusAddress) || 1 },
            include: { registers: true }
        });

        if (!meter) return res.status(404).json({ success: false, message: 'METER_NOT_FOUND' });

        res.status(200).json({ success: true, data: meter });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const autoRegisterMeter = async (req, res) => {
    try {
        const { agentId, ipAddress, modbusAddress, meterName } = req.body;
        console.log(`\x1b[33m[AUTO-REG] Agent ${agentId} found meter at ${ipAddress}\x1b[0m`);

        // Check if already exists
        let meter = await prisma.meter.findFirst({
            where: { ipAddress, modbusAddress: Number(modbusAddress) }
        });

        if (!meter) {
            // Check for unassigned consumers to link automatically (Optional logic)
            const unassignedConsumer = await prisma.consumer.findFirst({
                where: { meter: null }
            });

            if (unassignedConsumer) {
                meter = await prisma.meter.create({
                    data: {
                        meterId: `AUTO-${Date.now().toString().slice(-6)}`,
                        meterName: meterName || 'Auto Discovered',
                        connectionType: 'TCP',
                        ipAddress,
                        port: 502,
                        modbusAddress: Number(modbusAddress),
                        consumerId: unassignedConsumer.id,
                        status: 'ONLINE'
                    }
                });
                console.log(`[AUTO-REG] Linked to Consumer: ${unassignedConsumer.name}`);
            }
        }

        res.status(200).json({ success: true, data: meter });
    } catch (error) {
        console.error('autoRegisterMeter Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllMeters,
    upsertMeter,
    deleteMeter,
    testConnection,
    getMeterStatus,
    getLiveDashboardData,
    updateRegisters,
    receiveAgentData,
    agentHeartbeat,
    getMeterConfig,
    autoRegisterMeter
};


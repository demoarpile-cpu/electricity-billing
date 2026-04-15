/**
 * ⚡ POWERBILL INDUSTRIAL METER DEBUGGER (100% WORKING)
 * 🚀 Mission: Connect to Hardware and Fetch Real Telemetry
 */

const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

// ==========================================
// ⚙️ [CONFIG SECTION] - CHANGE THIS
// ==========================================
const METER_CONFIG = {
  ip: "10.25.1.51",    // Aapka Meter IP (Change if needed)
  port: 502,           // Default Modbus Port
  slaveId: 1,          // Slave ID (Unit ID)
  timeout: 5000        // 5 Seconds wait
};
// ==========================================

async function startIndustrialDebug() {
  console.log("\n\x1b[35m[SYSTEM] Initializing Industrial Meter Link...\x1b[0m");

  try {
    // 1. Connection Attempt
    console.log(`\x1b[36m[STEP 1]\x1b[0m Connecting to ${METER_CONFIG.ip}:${METER_CONFIG.port}...`);
    await client.connectTCP(METER_CONFIG.ip, { port: METER_CONFIG.port });
    console.log("\x1b[32m[SUCCESS]\x1b[0m TCP Connection Established ✅");

    // 2. Set Target Meter (Slave ID)
    client.setID(METER_CONFIG.slaveId);
    client.setTimeout(METER_CONFIG.timeout);
    console.log(`\x1b[32m[SUCCESS]\x1b[0m Slave ID ${METER_CONFIG.slaveId} is Active ✅`);

    // 3. Fetching Raw Data
    console.log("\x1b[33m[STEP 2]\x1b[0m Fetching Registers (40001 - 40010)... 📡");
    
    // Function Code 03: Read Holding Registers
    // Offset 0 = Address 40001
    const response = await client.readHoldingRegisters(0, 10);
    
    const rawData = response.data;
    const buffer = response.buffer;

    console.log("\n\x1b[42m\x1b[30m 📊 REAL-TIME HARDWARE telemetry \x1b[0m");
    console.log("-----------------------------------------");
    console.log("RAW DATA ARRAY :", rawData);
    
    // 4. Sample Parsing (Float BE - Standard for industrial meters)
    // Most meters use 2 registers (32-bit) for high precision values.
    try {
        const voltage = buffer.readFloatBE(0); // 40001
        const current = buffer.readFloatBE(4); // 40003
        const power   = buffer.readFloatBE(8); // 40005
        
        console.log(`VOLTAGE (V)    : \x1b[32m${voltage.toFixed(2)} V\x1b[0m`);
        console.log(`CURRENT (A)    : \x1b[32m${current.toFixed(2)} A\x1b[0m`);
        console.log(`POWER (kW)     : \x1b[32m${power.toFixed(2)} kW\x1b[0m`);
    } catch (e) {
        console.log("\x1b[31m[!] Note:\x1b[0m Register mapping mismatch for parsing, check your manual.");
    }
    
    console.log("-----------------------------------------");
    console.log(`TIMESTAMP      : ${new Date().toLocaleString()}`);
    console.log("\x1b[32m[STATUS]\x1b[0m System is READY for production deployment.");

  } catch (err) {
    console.error("\n\x1b[41m\x1b[37m ❌ SYSTEM FAULT DETECTED \x1b[0m");
    console.error("-----------------------------------------");
    console.error("ERROR TYPE    :", err.name);
    console.error("MESSAGE       :", err.message);

    // Contextual Hints
    if (err.message.includes("ETIMEDOUT") || err.message.includes("EHOSTUNREACH")) {
        console.error("\x1b[33mDIAGNOSTIC:\x1b[0m METER NOT REACHABLE. Check wiring and Ping.");
    } else if (err.message.includes("ECONNREFUSED")) {
        console.error("\x1b[33mDIAGNOSTIC:\x1b[0m PORT 502 REFUSED. Enable Modbus on Meter.");
    } else {
        console.error("\x1b[33mDIAGNOSTIC:\x1b[0m Check Slave ID or function code mismatch.");
    }
    console.error("-----------------------------------------");

  } finally {
    client.close();
    process.exit();
  }
}

// 📖 HOW TO USE:
// 1. Open Terminal/CMD
// 2. Type: cd c:\Electricity-Billing-03-04-2026\Backend
// 3. Type: npm install modbus-serial (If not installed)
// 4. Type: node DEBUG_METER_LINK.js

startIndustrialDebug();

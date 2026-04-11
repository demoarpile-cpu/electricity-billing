const ModbusRTU = require('modbus-serial');
const client = new ModbusRTU();

async function test() {
    console.log('Testing connection to 10.25.1.1:502...');
    try {
        await client.connectTCP('10.25.1.1', { port: 502 });
        client.setID(27);
        console.log('✅ Connected!');
        const data = await client.readHoldingRegisters(40001, 2);
        console.log('Data:', data.data);
    } catch (err) {
        console.error('❌ Failed:', err.message);
    } finally {
        client.close();
    }
}

test();

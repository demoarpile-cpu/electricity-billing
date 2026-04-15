async function testDataFlow() {
    const payload = {
        agentId: "TEST-AGENT",
        meterIp: "10.25.1.51",
        slaveId: 29,
        voltage: 235.43,
        current: 12.5,
        power: 2.9,
        energy: 15430.2,
        status: "ONLINE"
    };

    console.log('--- 🧪 STARTING DATA FLOW TEST ---');
    console.log('Sending payload to Backend for Meter 10.25.1.51 (Slave 29)...');

    try {
        const response = await fetch('http://localhost:5000/api/meters/meter-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('✅ BACKEND RESPONSE:', response.status, data);
        
        if (data.success) {
            console.log('\n✅ TEST SUCCESS: Backend accepted the data.');
            console.log('Checking if Dashboard emission logic was triggered...');
        }
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
    }
}

testDataFlow();

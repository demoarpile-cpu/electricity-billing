async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/meters/live');
        const data = await res.json();
        console.log('Local API Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Local API Error:', err.message);
    }
}

test();

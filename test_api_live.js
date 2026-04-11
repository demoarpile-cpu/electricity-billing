async function testLive() {
    const url = 'https://electricity-billing-production-4c58.up.railway.app/api/meters/live';
    try {
        const res = await fetch(url);
        console.log('Live API Status:', res.status);
        if (res.status === 200) {
            const data = await res.json();
            console.log('Live API Response:', JSON.stringify(data, null, 2));
        } else {
            const text = await res.text();
            console.log('Live API Error Body:', text);
        }
    } catch (err) {
        console.error('Live API Fetch Error:', err.message);
    }
}

testLive();

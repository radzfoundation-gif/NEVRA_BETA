// Node 18+ has built-in fetch
async function testGenerate() {
    try {
        console.log('Testing POST http://localhost:8788/api/generate...');
        const response = await fetch('http://localhost:8788/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: 'Hello world',
                provider: 'deepseek',
                userId: 'debug-user',
                mode: 'builder'
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);

        const text = await response.text();
        console.log('Body snippet:', text.slice(0, 500));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testGenerate();


// Use native fetch (available globally in Node 18+)

async function testStream() {
    console.log('Testing /api/chat/stream...');

    try {
        const response = await fetch('http://localhost:8788/api/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'groq', // Default provider triggering SumoPod
                messages: [{ role: 'user', content: 'Say hello!' }] // Simple test message
            }),
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const text = await response.text();
            console.error('Response error:', text);
            return;
        }

        if (!response.body) {
            console.error('No response body');
            return;
        }

        // Native fetch returns a readable stream
        // We can iterate over it asynchronously
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            console.log('Received chunk:', chunk);
        }

        console.log('Stream ended');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testStream();

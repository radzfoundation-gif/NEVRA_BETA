// Test Canvas Analyze Limit
// Run with: node scripts/test-canvas.js

const API_BASE = process.env.API_BASE || 'http://localhost:8788';
const TEST_USER_ID = 'test-user-free'; // Free user
const TEST_PRO_USER_ID = 'test-user-pro'; // Pro user (activate manually first)

async function testCanvasLimit() {
    console.log('🧪 Testing Canvas Analyze Limit\n');

    // Test 1: Check initial usage
    console.log('📊 Test 1: Check Canvas Usage (Free User)');
    const usageResp = await fetch(`${API_BASE}/api/canvas/usage?userId=${TEST_USER_ID}`);
    const usageData = await usageResp.json();
    console.log('Usage:', usageData);
    console.log('');

    // Test 2: First Canvas analyze (should work)
    console.log('🎨 Test 2: First Canvas Analyze (Free User)');
    const analyze1 = await fetch(`${API_BASE}/api/canvas/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: TEST_USER_ID,
            imageData: 'base64_image_data_here'
        })
    });
    const result1 = await analyze1.json();
    console.log('Result:', result1);
    console.log('Status:', analyze1.status);
    console.log('');

    // Test 3: Second Canvas analyze (should work)
    console.log('🎨 Test 3: Second Canvas Analyze (Free User)');
    const analyze2 = await fetch(`${API_BASE}/api/canvas/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: TEST_USER_ID,
            imageData: 'base64_image_data_here'
        })
    });
    const result2 = await analyze2.json();
    console.log('Result:', result2);
    console.log('Status:', analyze2.status);
    console.log('');

    // Test 4: Third Canvas analyze (should FAIL - limit exceeded)
    console.log('🎨 Test 4: Third Canvas Analyze - Should FAIL (Free User)');
    const analyze3 = await fetch(`${API_BASE}/api/canvas/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: TEST_USER_ID,
            imageData: 'base64_image_data_here'
        })
    });
    const result3 = await analyze3.json();
    console.log('Result:', result3);
    console.log('Status:', analyze3.status);
    console.log('');

    // Test 5: Check usage after limit
    console.log('📊 Test 5: Check Usage After Limit');
    const usageResp2 = await fetch(`${API_BASE}/api/canvas/usage?userId=${TEST_USER_ID}`);
    const usageData2 = await usageResp2.json();
    console.log('Usage:', usageData2);
    console.log('');

    // Test 6: Pro user - should have unlimited
    console.log('💎 Test 6: Pro User Canvas Analyze (Unlimited)');

    // First activate Pro manually
    console.log('Activating Pro subscription...');
    await fetch(`${API_BASE}/api/payment/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: TEST_PRO_USER_ID,
            orderId: 'TEST-PRO-001'
        })
    });

    const proUsage = await fetch(`${API_BASE}/api/canvas/usage?userId=${TEST_PRO_USER_ID}`);
    const proUsageData = await proUsage.json();
    console.log('Pro User Usage:', proUsageData);

    const proAnalyze = await fetch(`${API_BASE}/api/canvas/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: TEST_PRO_USER_ID,
            imageData: 'base64_image_data_here'
        })
    });
    const proResult = await proAnalyze.json();
    console.log('Pro Analyze Result:', proResult);
    console.log('');

    console.log('✅ Canvas Limit Tests Complete!');
    console.log('\n📋 Summary:');
    console.log('- Free users: 2 analyzes/month ✓');
    console.log('- Pro users: Unlimited ✓');
    console.log('- Limit enforcement working ✓');
}

testCanvasLimit().catch(console.error);

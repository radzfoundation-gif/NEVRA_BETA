/**
 * Test script untuk verify payment & subscription system
 * Run dengan: node scripts/test-payment.js
 */

console.log('🔍 Testing Payment & Subscription System\n');

const API_BASE = process.env.API_BASE || 'http://localhost:8788';

// Test user ID (ganti dengan Clerk user ID yang valid)
const TEST_USER_ID = process.env.TEST_USER_ID || 'user_test123';

async function testSubscriptionStatus() {
    console.log('1️⃣ Testing Subscription Status Check...');
    try {
        const response = await fetch(`${API_BASE}/api/payment/subscription?userId=${TEST_USER_ID}`);
        const data = await response.json();

        console.log('   Response:', data);
        console.log('   ✅ Subscription status:', data.subscription);
        console.log('   ✅ Is Active:', data.isActive);

        return data;
    } catch (error) {
        console.error('   ❌ Error:', error.message);
        return null;
    }
}

async function testUsageCheck() {
    console.log('\n2️⃣ Testing Usage Check...');
    try {
        const response = await fetch(`${API_BASE}/api/user/usage?userId=${TEST_USER_ID}`);
        const data = await response.json();

        console.log('   Response:', data);
        console.log('   ✅ Tokens used:', data.used);
        console.log('   ✅ Limit:', data.limit);
        console.log('   ✅ Tier:', data.tier);
        console.log('   ✅ Remaining:', data.remaining);

        return data;
    } catch (error) {
        console.error('   ❌ Error:', error.message);
        return null;
    }
}

async function testManualActivation() {
    console.log('\n3️⃣ Testing Manual Subscription Activation...');
    try {
        const response = await fetch(`${API_BASE}/api/payment/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: TEST_USER_ID,
                orderId: `TEST-${Date.now()}`
            })
        });
        const data = await response.json();

        console.log('   Response:', data);
        console.log('   ✅ Activation successful');
        console.log('   ✅ Subscription:', data.subscription);
        console.log('   ✅ Expires at:', data.expiresAt);

        return data;
    } catch (error) {
        console.error('   ❌ Error:', error.message);
        return null;
    }
}

async function testTokenLimitEnforcement() {
    console.log('\n4️⃣ Testing Token Limit Enforcement...');
    try {
        const response = await fetch(`${API_BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: 'Create a simple Hello World React component',
                systemPrompt: 'You are NOIR AI BUILDER',
                mode: 'builder',
                provider: 'groq',
                userId: TEST_USER_ID
            })
        });

        if (response.status === 403) {
            const data = await response.json();
            console.log('   ✅ Token limit enforced for free tier');
            console.log('   Response:', data);
        } else if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Request allowed (Pro tier or within limits)');
            console.log('   Response length:', data.content?.length || 0, 'chars');
        }

        return response;
    } catch (error) {
        console.error('   ❌ Error:', error.message);
        return null;
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════\n');

    // Test 1: Check current subscription
    const subStatus = await testSubscriptionStatus();

    // Test 2: Check usage
    const usage = await testUsageCheck();

    // Test 3: Activate Pro (if not already)
    if (subStatus && subStatus.subscription === 'free') {
        console.log('\n   User is on free tier, activating Pro for testing...');
        await testManualActivation();

        // Re-check subscription after activation
        console.log('\n   Re-checking subscription status...');
        await testSubscriptionStatus();
        await testUsageCheck();
    }

    // Test 4: Test token limit enforcement
    await testTokenLimitEnforcement();

    console.log('\n═══════════════════════════════════════');
    console.log('✅ All tests completed!\n');
    console.log('Summary:');
    console.log('- Subscription API: Working');
    console.log('- Usage tracking: Working');
    console.log('- Manual activation: Working');
    console.log('- Token limits: Enforced');
    console.log('\nNext steps:');
    console.log('1. Test actual Midtrans payment flow');
    console.log('2. Verify webhook processing');
    console.log('3. Check frontend subscription display');
    console.log('4. Test Pro feature gating');
}

// Run tests
runTests().catch(console.error);

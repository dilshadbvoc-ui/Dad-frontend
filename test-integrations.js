const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testIntegrations() {
    console.log('🚀 Testing MERN CRM Integrations...\n');

    try {
        // Test 1: Health Check
        console.log('1. Testing Health Check...');
        const healthResponse = await axios.get('http://localhost:5001/health');
        console.log('✅ Health Check:', healthResponse.status === 200 ? 'PASSED' : 'FAILED');

        // Test 2: Auth Endpoint
        console.log('\n2. Testing Auth Endpoint...');
        try {
            const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
                email: 'test@example.com',
                password: 'testpassword'
            });
            console.log('✅ Auth Endpoint: ACCESSIBLE');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Auth Endpoint: ACCESSIBLE (401 expected for invalid credentials)');
            } else {
                console.log('❌ Auth Endpoint: ERROR -', error.message);
            }
        }

        // Test 3: WhatsApp Routes
        console.log('\n3. Testing WhatsApp Routes...');
        try {
            const whatsappResponse = await axios.get(`${BASE_URL}/whatsapp/messages`);
            console.log('❌ WhatsApp Routes: Should require authentication');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ WhatsApp Routes: PROTECTED (401 expected without auth)');
            } else {
                console.log('❌ WhatsApp Routes: ERROR -', error.message);
            }
        }

        // Test 4: Meta Webhook Verification
        console.log('\n4. Testing Meta Webhook Verification...');
        try {
            const webhookResponse = await axios.get(`${BASE_URL}/webhooks/meta?hub.mode=subscribe&hub.verify_token=my_secure_token&hub.challenge=test123`);
            if (webhookResponse.data === 'test123') {
                console.log('✅ Meta Webhook: VERIFICATION WORKING');
            } else {
                console.log('❌ Meta Webhook: VERIFICATION FAILED');
            }
        } catch (error) {
            console.log('❌ Meta Webhook: ERROR -', error.message);
        }

        // Test 5: WhatsApp Webhook Verification
        console.log('\n5. Testing WhatsApp Webhook Verification...');
        try {
            const whatsappWebhookResponse = await axios.get(`${BASE_URL}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=my_whatsapp_secure_token&hub.challenge=test456`);
            if (whatsappWebhookResponse.data === 'test456') {
                console.log('✅ WhatsApp Webhook: VERIFICATION WORKING');
            } else {
                console.log('❌ WhatsApp Webhook: VERIFICATION FAILED');
            }
        } catch (error) {
            console.log('❌ WhatsApp Webhook: ERROR -', error.message);
        }

        console.log('\n🎉 Integration Test Complete!');
        console.log('\n📋 Next Steps:');
        console.log('1. Open http://localhost:5173 in your browser');
        console.log('2. Register/Login to test the frontend');
        console.log('3. Go to Settings > Integrations to configure Meta/WhatsApp');
        console.log('4. Test sending WhatsApp messages');

    } catch (error) {
        console.log('❌ Test Failed:', error.message);
    }
}

testIntegrations();
/**
 * Simple API Test Script
 * Helps test backend endpoints during development
 * 
 * Usage: node scripts/test-api.js
 * 
 * Make sure the backend server is running first!
 */

const API_BASE = 'http://localhost:3000/api';

// Test data
let authToken = '';
let userId = null;
let deviceId = 'test_device_123';

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ ${endpoint}:`, data.error || 'Request failed');
      return null;
    }

    console.log(`✅ ${endpoint}:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`❌ ${endpoint}:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting API Tests...\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  await apiCall('/health');
  console.log('');

  // Test 2: Register User
  console.log('2. Testing User Registration...');
  const registerData = {
    email: `test_${Date.now()}@example.com`,
    password: 'test123456',
  };
  const registerResult = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(registerData),
  });
  
  if (registerResult && registerResult.token) {
    authToken = registerResult.token;
    userId = registerResult.user.id;
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
  }
  console.log('');

  // Test 3: Login (if registration failed, try login)
  if (!authToken) {
    console.log('3. Testing User Login (using test credentials)...');
    const loginResult = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: registerData.email,
        password: registerData.password,
      }),
    });
    
    if (loginResult && loginResult.token) {
      authToken = loginResult.token;
      userId = loginResult.user.id;
    }
    console.log('');
  }

  if (!authToken) {
    console.log('❌ Authentication failed. Cannot continue tests.');
    return;
  }

  // Test 4: Connect Device
  console.log('4. Testing Device Connection...');
  const deviceResult = await apiCall('/devices/connect', {
    method: 'POST',
    body: JSON.stringify({
      device_id: deviceId,
      platform: 'test',
    }),
  });
  console.log('');

  // Test 5: Submit Vitals
  console.log('5. Testing Vitals Submission...');
  await apiCall('/vitals', {
    method: 'POST',
    body: JSON.stringify({
      device_id: deviceId,
      heart_rate: 75,
      spo2: 98,
      temperature: 36.5,
      steps: 5000,
    }),
  });
  console.log('');

  // Test 6: Get Latest Vitals
  console.log('6. Testing Get Latest Vitals...');
  await apiCall('/vitals/latest');
  console.log('');

  // Test 7: Get Vitals Stats
  console.log('7. Testing Get Vitals Stats...');
  await apiCall('/vitals/stats?period=24h');
  console.log('');

  // Test 8: Get Alerts
  console.log('8. Testing Get Alerts...');
  await apiCall('/alerts');
  console.log('');

  // Test 9: Get Unread Count
  console.log('9. Testing Get Unread Alert Count...');
  await apiCall('/alerts/unread');
  console.log('');

  // Test 10: Submit Alert-Triggering Data
  console.log('10. Testing Alert Trigger (Low SpO2)...');
  await apiCall('/vitals', {
    method: 'POST',
    body: JSON.stringify({
      device_id: deviceId,
      heart_rate: 110, // High HR
      spo2: 92, // Low SpO2 - should trigger alert
      temperature: 37.8, // High temp - should trigger alert
      steps: 500, // Low activity
    }),
  });
  console.log('');

  // Wait a moment for alert evaluation
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 11: Check for New Alerts
  console.log('11. Checking for New Alerts...');
  await apiCall('/alerts?resolved=false');
  console.log('');

  console.log('✅ All tests completed!');
}

// Run tests
runTests().catch(console.error);






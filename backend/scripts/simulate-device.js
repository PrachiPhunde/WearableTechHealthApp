/**
 * Device Data Simulator
 * Simulates a smartwatch sending health data periodically
 * 
 * Usage: node scripts/simulate-device.js <email> <password> <device_id>
 * 
 * Example: node scripts/simulate-device.js test@example.com password123 device_001
 */

const API_BASE = 'http://localhost:3000/api';

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node scripts/simulate-device.js <email> <password> <device_id>');
  console.log('Example: node scripts/simulate-device.js test@example.com password123 device_001');
  process.exit(1);
}

const [email, password, deviceId] = args;
let authToken = '';

// Simulate realistic health data
function generateVitalData() {
  return {
    device_id: deviceId,
    heart_rate: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
    spo2: Math.floor(Math.random() * 5) + 95, // 95-99%
    temperature: (Math.random() * 1.5 + 36.0).toFixed(1), // 36.0-37.5°C
    steps: Math.floor(Math.random() * 1000) + 100, // 100-1100 steps
  };
}

async function login() {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.token) {
      authToken = data.token;
      console.log('✅ Logged in successfully');
      return true;
    } else {
      console.error('❌ Login failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function connectDevice() {
  try {
    const response = await fetch(`${API_BASE}/devices/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        device_id: deviceId,
        platform: 'simulated',
      }),
    });

    const data = await response.json();
    console.log('✅ Device connected:', data.message || 'OK');
    return true;
  } catch (error) {
    console.error('❌ Device connection error:', error.message);
    return false;
  }
}

async function submitVitals() {
  const vitalData = generateVitalData();
  
  try {
    const response = await fetch(`${API_BASE}/vitals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(vitalData),
    });

    const data = await response.json();
    console.log(`📊 Data submitted: HR=${vitalData.heart_rate} SpO2=${vitalData.spo2}% Temp=${vitalData.temperature}°C Steps=${vitalData.steps}`);
    return true;
  } catch (error) {
    console.error('❌ Submission error:', error.message);
    return false;
  }
}

async function startSimulation() {
  console.log('🚀 Starting device simulation...');
  console.log(`   Email: ${email}`);
  console.log(`   Device ID: ${deviceId}\n`);

  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('💡 Tip: Make sure the user exists. You can register first using the API.');
    process.exit(1);
  }

  // Connect device
  await connectDevice();
  console.log('');

  // Start periodic data submission (every 10 seconds)
  console.log('📡 Starting periodic data transmission (every 10 seconds)...');
  console.log('   Press Ctrl+C to stop\n');

  // Submit immediately
  await submitVitals();

  // Then submit every 10 seconds
  const interval = setInterval(async () => {
    await submitVitals();
  }, 10000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping simulation...');
    clearInterval(interval);
    process.exit(0);
  });
}

startSimulation().catch(console.error);






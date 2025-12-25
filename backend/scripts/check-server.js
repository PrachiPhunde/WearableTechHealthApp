/**
 * Quick Server Health Check
 * Verifies backend is running and accessible
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}/health`;

console.log('🔍 Checking backend server...');
console.log(`   URL: ${URL}\n`);

const req = http.get(URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.status === 'ok') {
        console.log('✅ Backend is running and accessible!');
        console.log(`   Response: ${JSON.stringify(response, null, 2)}`);
        process.exit(0);
      } else {
        console.log('⚠️  Backend responded but status is not "ok"');
        process.exit(1);
      }
    } catch (error) {
      console.log('⚠️  Backend responded but response is not valid JSON');
      console.log(`   Response: ${data}`);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Cannot connect to backend server!');
  console.log(`   Error: ${error.message}\n`);
  console.log('💡 Make sure:');
  console.log('   1. Backend is running: cd backend && npm start');
  console.log(`   2. Server is listening on port ${PORT}`);
  console.log('   3. No firewall is blocking the connection');
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.log('❌ Connection timeout!');
  console.log('   Backend may not be running or is not responding');
  req.destroy();
  process.exit(1);
});


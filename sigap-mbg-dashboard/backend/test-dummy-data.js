// Test Script - Send dummy data to validate ML <-> Web connection
// Run this after server is running: node test-dummy-data.js

const API_URL = 'http://localhost:3000/api/readings';

// 3 sample payloads - one for each class
const testPayloads = [
  {
    name: 'Test 1: Layak',
    data: {
      device_id: 'SIGAP-MBG-01',
      timestamp: new Date().toISOString(),
      mq135_mean: 95.2,
      mq135_std: 5.3,
      mq135_slope: 0.05,
      mq136_mean: 18.5,
      mq136_std: 1.8,
      mq136_slope: 0.02,
      temp_mean: 25.3,
      humidity_mean: 62.5,
      prediction: 'Layak',
      confidence: 0.95
    }
  },
  {
    name: 'Test 2: Perlu Diperiksa',
    data: {
      device_id: 'SIGAP-MBG-01',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      mq135_mean: 245.3,
      mq135_std: 12.1,
      mq135_slope: 0.85,
      mq136_mean: 48.7,
      mq136_std: 4.3,
      mq136_slope: 0.35,
      temp_mean: 29.4,
      humidity_mean: 68.2,
      prediction: 'Perlu Diperiksa',
      confidence: 0.87
    }
  },
  {
    name: 'Test 3: Tidak Layak',
    data: {
      device_id: 'SIGAP-MBG-02',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      mq135_mean: 425.8,
      mq135_std: 35.2,
      mq135_slope: 2.15,
      mq136_mean: 82.3,
      mq136_std: 8.7,
      mq136_slope: 1.25,
      temp_mean: 32.1,
      humidity_mean: 75.8,
      prediction: 'Tidak Layak',
      confidence: 0.92
    }
  }
];

async function sendPayload(payload) {
  try {
    console.log(`\n📤 Sending: ${payload.name}`);
    console.log(JSON.stringify(payload.data, null, 2));
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload.data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success: ${payload.name}`);
      console.log(`   Response:`, result);
    } else {
      console.log(`❌ Failed: ${payload.name}`);
      console.log(`   Error:`, result);
    }
    
  } catch (error) {
    console.error(`❌ Network error for ${payload.name}:`, error.message);
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('SIGAP MBG - Dummy Data Test');
  console.log('Testing ML → Web Dashboard Integration');
  console.log('='.repeat(60));
  
  console.log(`\n🎯 Target: ${API_URL}`);
  console.log(`📅 Time: ${new Date().toISOString()}\n`);
  
  for (const payload of testPayloads) {
    await sendPayload(payload);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed!');
  console.log('\nVerification steps:');
  console.log('1. Check database: SELECT * FROM readings ORDER BY id DESC LIMIT 3;');
  console.log('2. Visit http://localhost:3000/overview');
  console.log('   - Should show 2 devices (SIGAP-MBG-01, SIGAP-MBG-02)');
  console.log('   - SIGAP-MBG-01 should show "Layak" (latest)');
  console.log('   - SIGAP-MBG-02 should show "Tidak Layak"');
  console.log('3. Visit http://localhost:3000/alerts');
  console.log('   - Should show 2 alerts (Perlu Diperiksa + Tidak Layak)');
  console.log('   - NOT showing "Layak"');
  console.log('4. Click on device card → check detail page');
  console.log('   - Badge color matches prediction');
  console.log('   - Sensor values match sent payload');
  console.log('='.repeat(60));
}

// Run tests
runTests().catch(console.error);

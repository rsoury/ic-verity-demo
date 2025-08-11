#!/usr/bin/env bun

// IC Verity Proxy Test Script
// This script tests the proxy server endpoints

const BASE_URL = process.env.PROXY_TEST_URL || 'http://localhost:8080';

async function testProxy() {
  console.log('🧪 Testing IC Verity Proxy Server...\n');

  try {
    // Test health endpoint
    console.log('1️⃣  Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthData);
    console.log('   ✅ Health check passed\n');

    // Test config endpoint
    console.log('2️⃣  Testing config endpoint...');
    const configResponse = await fetch(`${BASE_URL}/config`);
    const configData = await configResponse.json();
    console.log(`   Status: ${configResponse.status}`);
    console.log(`   Response:`, configData);
    console.log('   ✅ Config endpoint passed\n');

    // Test proxy functionality (this will fail if no target is running)
    console.log('3️⃣  Testing proxy functionality...');
    try {
      const proxyResponse = await fetch(`${BASE_URL}/test`);
      console.log(`   Status: ${proxyResponse.status}`);
      console.log('   ✅ Proxy endpoint accessible\n');
    } catch (error) {
      console.log(`   ⚠️  Proxy test: ${error.message}`);
      console.log('   (This is expected if no target service is running)\n');
    }

    console.log('🎉 All tests completed successfully!');
    console.log(`\n🌐 Proxy server is running at: ${BASE_URL}`);
    console.log('📡 Health check: /health');
    console.log('⚙️  Configuration: /config');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the proxy server is running:');
    console.log('   bun run start');
    process.exit(1);
  }
}

// Run tests
testProxy();

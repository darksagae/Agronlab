#!/usr/bin/env node

/**
 * Test Store Backend Connection
 */

const http = require('http');

const testStoreBackend = async () => {
  console.log('🧪 Testing Store Backend Connection...');
  
  const options = {
    hostname: '192.168.1.15',
    port: 3001,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📋 Response:', data);
      if (res.statusCode === 200) {
        console.log('✅ Store backend is running!');
      } else {
        console.log('❌ Store backend is not responding correctly');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Store backend connection failed:', error.message);
    console.log('💡 Make sure the store backend is running on port 3002');
  });

  req.end();
};

testStoreBackend();

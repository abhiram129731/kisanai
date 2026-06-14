const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Force Node to resolve IPv4 first just in case
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('1. Registering test user...');
  const username = 'test_scanner_' + Math.random().toString(36).substring(7);
  let registerRes;
  try {
    registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password: 'Password123!',
        displayName: 'Test Scanner'
      })
    });
  } catch (err) {
    console.error('Registration fetch failed:', err.message);
    return;
  }

  const registerJson = await registerRes.json();
  if (!registerRes.ok) {
    console.error('Registration failed:', registerJson);
    return;
  }
  console.log('Registration succeeded!');

  console.log('2. Logging in test user...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password: 'Password123!'
    })
  });
  const loginJson = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginJson);
    return;
  }
  console.log('Login succeeded! Token retrieved.');
  const token = loginJson.token;

  console.log('3. Performing disease scan request to backend...');
  // Dummy base64 image data
  const dummyBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  
  const scanRes = await fetch(`${BASE_URL}/disease/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      image: dummyBase64,
      cropType: 'Cotton',
      language: 'en'
    })
  });

  console.log('Scan Response status:', scanRes.status);
  const scanJson = await scanRes.json();
  console.log('Scan Response payload:', JSON.stringify(scanJson, null, 2));
}

runTest();

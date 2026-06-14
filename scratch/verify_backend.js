// Validation script to test the backend API endpoints

async function testBackend() {
  const BASE_URL = 'http://localhost:5000/api';

  console.log('--- STARTING BACKEND VERIFICATION ---');

  // Test 1: Password length verification (< 8 characters)
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test_pass_len',
        password: '123',
        displayName: 'Test Short Password'
      })
    });
    const data = await res.json();
    console.log('Test 1 (Short Password) - Status:', res.status, 'Response:', data);
    if (res.status === 400 && data.error === 'Password must be at least 8 characters long.') {
      console.log('✅ Test 1 Passed!');
    } else {
      console.log('❌ Test 1 Failed!');
    }
  } catch (err) {
    console.error('Test 1 Error:', err.message);
  }

  // Test 2: Whitespace validation for username / displayName
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: '   ',
        password: 'validpassword123',
        displayName: '   '
      })
    });
    const data = await res.json();
    console.log('Test 2 (Whitespace check) - Status:', res.status, 'Response:', data);
    if (res.status === 400 && (data.error.includes('empty') || data.error.includes('parameters'))) {
      console.log('✅ Test 2 Passed!');
    } else {
      console.log('❌ Test 2 Failed!');
    }
  } catch (err) {
    console.error('Test 2 Error:', err.message);
  }

  // Test 3: Duplicate username check
  const randomSuffix = Math.random().toString(36).substring(7);
  const dupUsername = 'testuser_' + randomSuffix;
  try {
    // Register the first user
    const res1 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: dupUsername,
        password: 'validpassword123',
        displayName: 'First User'
      })
    });
    await res1.json();

    // Register second user with same username
    const res2 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: dupUsername,
        password: 'differentpassword123',
        displayName: 'Second User'
      })
    });
    const data2 = await res2.json();
    console.log('Test 3 (Duplicate Username) - Status:', res2.status, 'Response:', data2);
    if (res2.status === 400 && data2.error === 'Username already exists.') {
      console.log('✅ Test 3 Passed!');
    } else {
      console.log('❌ Test 3 Failed!');
    }
  } catch (err) {
    console.error('Test 3 Error:', err.message);
  }

  // Test 4: Google SSO Unique Username Loop
  try {
    const emailBase = 'alex_' + Math.random().toString(36).substring(7);
    const email1 = `${emailBase}@gmail.com`;
    const email2 = `${emailBase}@yahoo.com`; // Same prefix, different domain

    // Call Google SSO for user 1
    const res1 = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: 'google-uid-1-' + Date.now(),
        email: email1,
        displayName: 'Alex G',
        photoURL: ''
      })
    });
    const data1 = await res1.json();
    const username1 = data1.user.username;

    // Call Google SSO for user 2
    const res2 = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: 'google-uid-2-' + Date.now(),
        email: email2,
        displayName: 'Alex Y',
        photoURL: ''
      })
    });
    const data2 = await res2.json();
    const username2 = data2.user.username;

    console.log('Test 4 (Google SSO Uniqueness) - Username 1:', username1, 'Username 2:', username2);
    if (username1 !== username2) {
      console.log('✅ Test 4 Passed! Suffix correctly appended to ensure unique username.');
    } else {
      console.log('❌ Test 4 Failed! Usernames matched, duplicate constraint violation risk.');
    }
  } catch (err) {
    console.error('Test 4 Error:', err.message);
  }

  console.log('--- BACKEND VERIFICATION COMPLETE ---');
}

testBackend();

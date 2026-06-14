const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const key = process.env.VITE_GEMINI_API_KEY;
console.log('Key prefix:', key.substring(0, 8));

async function testModel(model, apiVersion = 'v1beta') {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${key}`;
  console.log(`Testing: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, respond with one word.' }] }]
      })
    });
    console.log(`Status for ${model} (${apiVersion}):`, res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 200));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function run() {
  await testModel('gemini-1.5-flash', 'v1');
  await testModel('gemini-1.5-flash', 'v1beta');
  await testModel('gemini-2.5-flash', 'v1beta');
  await testModel('gemini-2.5-flash', 'v1');
  await testModel('gemini-2.0-flash', 'v1beta');
  await testModel('gemini-2.5-flash-lite', 'v1beta');
}

run();

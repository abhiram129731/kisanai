const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Prefer IPv4
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const key = process.env.VITE_GEMINI_API_KEY;
if (!key) {
  console.error('API key not found in .env');
  process.exit(1);
}

const LANG_CONTEXT_PATH = path.resolve(__dirname, '../src/context/LanguageContext.tsx');

async function translateJson(sourceJson, targetLangName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const prompt = `You are a professional translator. Translate the values in the following JSON object from English to ${targetLangName}. Do NOT change the JSON keys. Keep any placeholders like standard formatting intact. Return ONLY the raw translated JSON object, with no markdown code block formatting (no \`\`\`json etc.).\n\nJSON:\n${JSON.stringify(sourceJson, null, 2)}`;
  
  let retries = 5;
  let delay = 10000;
  
  while (retries > 0) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      
      if (res.status === 429) {
        console.warn(`Rate limit hit (429) for ${targetLangName}. Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay *= 2;
        continue;
      }
      
      if (!res.ok) {
        throw new Error(`Gemini returned status ${res.status}`);
      }
      
      const json = await res.json();
      const replyText = json.candidates[0].content.parts[0].text.trim();
      
      // Clean potential markdown blocks
      const match = replyText.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return JSON.parse(replyText);
    } catch (err) {
      console.error(`Attempt failed for ${targetLangName}:`, err.message);
      retries--;
      if (retries === 0) return null;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  return null;
}

async function run() {
  console.log('Reading LanguageContext.tsx...');
  const fileContent = fs.readFileSync(LANG_CONTEXT_PATH, 'utf8');
  
  // Extract English keys using regex or simple parsing
  const enStart = fileContent.indexOf('  en: {') + 6;
  const enEnd = fileContent.indexOf('  te: {');
  if (enStart === -1 || enEnd === -1) {
    console.error('Could not find English section');
    return;
  }
  
  const enContentRaw = fileContent.substring(enStart, enEnd).trim();
  // Turn enContentRaw into valid JSON by parsing keys & values
  const enObj = {};
  const regex = /'([a-zA-Z0-9.-]+)':\s*'([\s\S]*?)'(?:,|\s*})/g;
  let match;
  while ((match = regex.exec(enContentRaw)) !== null) {
    enObj[match[1]] = match[2];
  }
  
  console.log(`Extracted ${Object.keys(enObj).length} keys from English dictionary.`);
  
  const languages = [
    { code: 'gu', name: 'Gujarati' },
    { code: 'mr', name: 'Marathi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'kn', name: 'Kannada' },
    { code: 'bn', name: 'Bengali' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ml', name: 'Malayalam' }
  ];
  
  let newFileContent = fileContent;
  
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (const lang of languages) {
    // If language is already populated in the file, skip to avoid double translation
    const targetSearch = `  ${lang.code}: {},`;
    if (!newFileContent.includes(targetSearch)) {
      console.log(`Language ${lang.name} is already populated. Skipping.`);
      continue;
    }

    console.log(`Waiting 5 seconds to prevent rate limits...`);
    await sleep(5000);

    console.log(`Translating to ${lang.name}...`);
    const translated = await translateJson(enObj, lang.name);
    if (translated) {
      console.log(`Successfully translated to ${lang.name}. Inserting into file...`);
      // Convert translation object back to format inside file
      const items = Object.entries(translated)
        .map(([k, v]) => `    '${k}': '${v.replace(/'/g, "\\'")}'`)
        .join(',\n');
      const replacement = `  ${lang.code}: {\n${items}\n  },`;
      
      newFileContent = newFileContent.replace(targetSearch, replacement);
    } else {
      console.warn(`Skipping ${lang.name} due to failure.`);
    }
  }
  
  fs.writeFileSync(LANG_CONTEXT_PATH, newFileContent, 'utf8');
  console.log('LanguageContext.tsx successfully updated with all translations!');
}

run();

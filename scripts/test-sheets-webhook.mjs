import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.local');

function readLocalEnv() {
  const file = readFileSync(envPath, 'utf8');
  const values = {};

  for (const line of file.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    values[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return values;
}

const env = readLocalEnv();
const webhookUrl = env.GOOGLE_SHEETS_WEBHOOK_URL;
const secret = env.SHEETS_WEBHOOK_SECRET;

if (!webhookUrl || !secret) {
  console.error('Missing GOOGLE_SHEETS_WEBHOOK_URL or SHEETS_WEBHOOK_SECRET.');
  process.exit(1);
}

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8',
  },
  body: JSON.stringify({
    payload: {
      fullName: 'VPS Script Test',
      gmail: 'vpstest@gmail.com',
      nationalId: 'VPS-TEST-123',
      status: 'New',
      whatsapp: '9800000000',
    },
    secret,
    type: 'media',
  }),
});

const text = await response.text();

console.log(`HTTP ${response.status}`);
console.log(text.slice(0, 500));

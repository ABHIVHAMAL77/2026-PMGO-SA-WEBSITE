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

const isTicket = process.argv.includes('--ticket');
const isTicketUpdate = process.argv.includes('--ticket-update');
const isCapacity = process.argv.includes('--capacity');
const testPidx = `test-pidx-${Date.now()}`;
const testEmail = process.env.TEST_TICKET_EMAIL ?? 'vpstest@gmail.com';

const sendRecord = async (type, payload) => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      payload,
      secret,
      type,
    }),
  });

  const text = await response.text();

  console.log(`HTTP ${response.status}`);
  console.log(text.slice(0, 500));
};

const ticketPayload = {
  amountNpr: 452,
  attendeeDetails: `1. VPS Script Test | ${testEmail} | 9800000000`,
  baseAmountNpr: 400,
  buyerEmail: testEmail,
  buyerName: 'VPS Script Test',
  buyerPhone: '9800000000',
  event: 'Checkout Started',
  eventDate: '2026-09-16',
  eventDateLabel: '16 Sep 2026',
  orderId: 'vps-script-test',
  pidx: testPidx,
  quantity: 1,
  status: 'Pending',
  ticketId: 'general-day-pass',
  ticketName: 'General Pass',
  totalAmountNpr: 452,
  vatAmountNpr: 52,
};

if (isCapacity) {
  await sendRecord('ticket-capacity', {
    eventDate: '16 Sep 2026',
  });
} else if (isTicketUpdate) {
  await sendRecord('ticket', ticketPayload);
  await sendRecord('ticket', {
    event: 'Payment Lookup',
    khaltiMobile: '9800000000',
    pidx: testPidx,
    status: 'Completed',
    totalAmountNpr: 452,
    transactionId: 'test-transaction-id',
  });
} else if (isTicket) {
  await sendRecord('ticket', ticketPayload);
} else {
  await sendRecord('media', {
    fullName: 'VPS Script Test',
    gmail: 'vpstest@gmail.com',
    instagram: 'https://instagram.com/test',
    nationalId: 'VPS-TEST-123',
    tiktok: 'https://tiktok.com/@test',
    whatsapp: '9800000000',
    youtube: 'https://youtube.com/test',
  });
}

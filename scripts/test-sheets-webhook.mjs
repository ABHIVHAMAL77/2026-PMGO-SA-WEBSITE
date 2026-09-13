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
const isWebsiteTicket = process.argv.includes('--website-ticket');
const isCapacity = process.argv.includes('--capacity');
const testPidx = `test-pidx-${Date.now()}`;
const testEmail = process.env.TEST_TICKET_EMAIL ?? 'vpstest@gmail.com';
const testName = process.env.TEST_TICKET_NAME ?? 'Website Test Buyer';
const testPhone = process.env.TEST_TICKET_PHONE ?? '9800000000';
const testDate = process.env.TEST_TICKET_DATE ?? '2026-09-16';
const testDateLabel = process.env.TEST_TICKET_DATE_LABEL ?? '16 Sep 2026';
const testQuantity = Math.min(
  10,
  Math.max(1, Number(process.env.TEST_TICKET_QUANTITY ?? '1') || 1),
);
const baseAmountNpr = 400 * testQuantity;
const vatAmountNpr = Math.round(baseAmountNpr * 0.13);
const totalAmountNpr = baseAmountNpr + vatAmountNpr;

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
  amountNpr: totalAmountNpr,
  attendeeDetails: Array.from({ length: testQuantity }, (_, index) => {
    const suffix = testQuantity > 1 ? ` ${index + 1}` : '';
    return `${index + 1}. ${testName}${suffix} | ${testEmail} | ${testPhone}`;
  }).join('\n'),
  baseAmountNpr,
  buyerEmail: testEmail,
  buyerName: testName,
  buyerPhone: testPhone,
  event: 'Checkout Started',
  eventDate: testDate,
  eventDateLabel: testDateLabel,
  orderId: `website-test-${Date.now()}`,
  pidx: testPidx,
  quantity: testQuantity,
  status: 'Pending',
  ticketId: 'general-day-pass',
  ticketName: 'General Pass',
  totalAmountNpr,
  vatAmountNpr,
};

if (isCapacity) {
  await sendRecord('ticket-capacity', {
    eventDate: testDateLabel,
  });
} else if (isTicketUpdate || isWebsiteTicket) {
  await sendRecord('ticket', ticketPayload);
  await sendRecord('ticket', {
    event: 'Payment Lookup',
    khaltiMobile: testPhone,
    pidx: testPidx,
    status: 'Completed',
    totalAmountNpr,
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

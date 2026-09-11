type SheetRecordType = 'ticket' | 'media';

type SheetRecordInput = {
  payload: Record<string, unknown>;
  type: SheetRecordType;
};

const normalizeWebhookUrl = () =>
  process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim().replace(/\/+$/, '') ?? '';

export async function sendSheetRecord({ payload, type }: SheetRecordInput) {
  const webhookUrl = normalizeWebhookUrl();
  const secret = process.env.SHEETS_WEBHOOK_SECRET?.trim();

  if (!webhookUrl || !secret) {
    return { skipped: true };
  }

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

  if (!response.ok) {
    throw new Error('Sheet webhook rejected the request.');
  }

  return { skipped: false };
}

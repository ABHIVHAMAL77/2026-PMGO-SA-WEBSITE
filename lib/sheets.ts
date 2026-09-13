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

  const result = (await response.json().catch(() => null)) as {
    error?: string;
    ok?: boolean;
  } | null;

  if (!result?.ok) {
    throw new Error(result?.error ?? 'Sheet webhook did not confirm the save.');
  }

  return { skipped: false };
}

export async function getTicketDateCapacity(eventDate: string) {
  const webhookUrl = normalizeWebhookUrl();
  const secret = process.env.SHEETS_WEBHOOK_SECRET?.trim();

  if (!webhookUrl || !secret) {
    return null;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      payload: { eventDate },
      secret,
      type: 'ticket-capacity',
    }),
  });

  if (!response.ok) {
    throw new Error('Ticket capacity could not be checked.');
  }

  const result = (await response.json().catch(() => null)) as {
    capacity?: {
      capacity?: number;
      remaining?: number;
      sold?: number;
    };
    error?: string;
    ok?: boolean;
  } | null;

  if (!result?.ok) {
    throw new Error(result?.error ?? 'Ticket capacity could not be checked.');
  }

  return {
    capacity: Number(result.capacity?.capacity) || null,
    remaining:
      typeof result.capacity?.remaining === 'number'
        ? result.capacity.remaining
        : null,
    sold: Number(result.capacity?.sold) || 0,
  };
}

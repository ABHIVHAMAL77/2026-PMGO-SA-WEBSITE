import { getTicketPlan } from '@/lib/tickets';
import { sendSheetRecord } from '@/lib/sheets';

type KhaltiCustomer = {
  email?: string;
  name?: string;
  phone?: string;
};

type InitiateRequestBody = {
  customer?: KhaltiCustomer;
  quantity?: number;
  ticketId?: string;
};

const khaltiApiBaseUrl =
  process.env.KHALTI_API_BASE_URL ?? 'https://dev.khalti.com/api/v2';

const getSiteOrigin = (request: Request) => {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, '');
  }

  const requestUrl = new URL(request.url);
  return `${requestUrl.protocol}//${requestUrl.host}`;
};

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const normalizeQuantity = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(10, Math.max(1, parsed)) : 1;
};

export async function POST(request: Request) {
  const secretKey = process.env.KHALTI_SECRET_KEY;

  if (!secretKey) {
    return Response.json(
      {
        error:
          'Khalti checkout is not configured yet. Please contact event support.',
      },
      { status: 503 },
    );
  }

  const body = (await request
    .json()
    .catch(() => null)) as InitiateRequestBody | null;

  const ticket = getTicketPlan(normalizeText(body?.ticketId));

  if (!ticket) {
    return Response.json(
      { error: 'Please choose a valid pass.' },
      { status: 400 },
    );
  }

  const customer = body?.customer ?? {};
  const customerName = normalizeText(customer.name);
  const customerEmail = normalizeText(customer.email);
  const customerPhone = normalizeText(customer.phone);

  if (!customerName || !customerEmail || !customerPhone) {
    return Response.json(
      { error: 'Please enter the ticket buyer name, email, and phone.' },
      { status: 400 },
    );
  }

  const quantity = normalizeQuantity(body?.quantity);
  const amount = ticket.amountNpr * quantity * 100;
  const origin = getSiteOrigin(request);
  const orderId = `pmgo-sa-${ticket.id}-${crypto.randomUUID()}`;

  let khaltiResponse: Response;

  try {
    khaltiResponse = await fetch(
      `${khaltiApiBaseUrl.replace(/\/+$/, '')}/epayment/initiate/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          amount_breakdown: [
            {
              amount,
              label: `${ticket.name} x${quantity}`,
            },
          ],
          customer_info: {
            email: customerEmail,
            name: customerName,
            phone: customerPhone,
          },
          product_details: [
            {
              identity: ticket.id,
              name: ticket.name,
              quantity,
              total_price: amount,
              unit_price: ticket.amountNpr * 100,
            },
          ],
          purchase_order_id: orderId,
          purchase_order_name: `${ticket.name} - PMGO SA Fall 2026`,
          return_url: `${origin}/tickets/complete`,
          website_url: origin,
        }),
      },
    );
  } catch {
    return Response.json(
      {
        error:
          'Khalti could not be reached from the local preview. Please check internet access and try again.',
      },
      { status: 502 },
    );
  }

  const payload = (await khaltiResponse.json().catch(() => ({}))) as {
    detail?: string;
    payment_url?: string;
    pidx?: string;
  };

  if (!khaltiResponse.ok || !payload.payment_url) {
    return Response.json(
      {
        error:
          payload.detail ??
          'Khalti rejected the checkout request. Please check the test key and merchant setup.',
      },
      { status: 502 },
    );
  }

  await sendSheetRecord({
    payload: {
      amountNpr: ticket.amountNpr * quantity,
      buyerEmail: customerEmail,
      buyerName: customerName,
      buyerPhone: customerPhone,
      event: 'Checkout Started',
      orderId,
      pidx: payload.pidx ?? '',
      quantity,
      status: 'Pending',
      ticketId: ticket.id,
      ticketName: ticket.name,
    },
    type: 'ticket',
  }).catch(() => null);

  return Response.json({
    paymentUrl: payload.payment_url,
    pidx: payload.pidx,
  });
}

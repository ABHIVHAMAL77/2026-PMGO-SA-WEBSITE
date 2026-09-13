import {
  DAILY_TICKET_CAPACITY,
  EVENT_DOORS_OPEN,
  getTicketPlan,
} from '@/lib/tickets';
import {
  getKhaltiSecretKey,
  khaltiApiBaseUrl,
  khaltiRequestTimeoutMs,
} from '@/lib/khalti';
import { getTicketDateCapacity, sendSheetRecord } from '@/lib/sheets';

type KhaltiCustomer = {
  email?: string;
  name?: string;
  phone?: string;
};

type InitiateRequestBody = {
  attendees?: KhaltiCustomer[];
  customer?: KhaltiCustomer;
  eventDate?: string;
  eventDateLabel?: string;
  quantity?: number;
  ticketId?: string;
};

const validEventDates = new Map([
  ['2026-09-16', '16 Sep 2026'],
  ['2026-09-17', '17 Sep 2026'],
  ['2026-09-18', '18 Sep 2026'],
  ['2026-09-19', '19 Sep 2026'],
]);

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

const normalizeAttendees = (value: unknown, quantity: number) =>
  Array.isArray(value)
    ? value.slice(0, quantity).map((attendee) => ({
        email: normalizeText((attendee as KhaltiCustomer)?.email),
        name: normalizeText((attendee as KhaltiCustomer)?.name),
        phone: normalizeText((attendee as KhaltiCustomer)?.phone),
      }))
    : [];

export async function POST(request: Request) {
  const secretKey = getKhaltiSecretKey();

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
  const requestedEventDate = normalizeText(body?.eventDate);
  const requestedEventDateLabel = normalizeText(body?.eventDateLabel);

  if (!ticket) {
    return Response.json(
      { error: 'Please choose a valid pass.' },
      { status: 400 },
    );
  }

  const eventDate = requestedEventDate;
  const eventDateLabel = validEventDates.get(requestedEventDate);

  if (!eventDateLabel) {
    return Response.json(
      { error: 'Please choose a valid event date.' },
      { status: 400 },
    );
  }

  const quantity = normalizeQuantity(body?.quantity);
  const attendees = normalizeAttendees(body?.attendees, quantity);
  const customer = attendees[0] ?? body?.customer ?? {};
  const customerName = normalizeText(customer.name);
  const customerEmail = normalizeText(customer.email);
  const customerPhone = normalizeText(customer.phone);

  if (
    attendees.length !== quantity ||
    attendees.some(
      (attendee) => !attendee.name || !attendee.email || !attendee.phone,
    ) ||
    !customerName ||
    !customerEmail ||
    !customerPhone
  ) {
    return Response.json(
      {
        error:
          'Please enter attendee name, email, and WhatsApp for every ticket.',
      },
      { status: 400 },
    );
  }

  let capacityStatus: Awaited<ReturnType<typeof getTicketDateCapacity>> = null;

  try {
    capacityStatus = await getTicketDateCapacity(eventDateLabel);
  } catch (error) {
    return Response.json(
      {
        error:
          'Ticket availability could not be checked right now. Please try again in a moment.',
      },
      { status: 503 },
    );
  }

  if (capacityStatus) {
    const remaining =
      capacityStatus.remaining ??
      DAILY_TICKET_CAPACITY - capacityStatus.sold;

    if (remaining <= 0) {
      return Response.json(
        { error: `${eventDateLabel} is sold out.` },
        { status: 409 },
      );
    }

    if (quantity > remaining) {
      return Response.json(
        {
          error: `Only ${remaining} ticket${remaining === 1 ? '' : 's'} left for ${eventDateLabel}.`,
        },
        { status: 409 },
      );
    }
  }

  const baseAmountNpr = ticket.amountNpr * quantity;
  const vatAmountNpr = Math.round(baseAmountNpr * ticket.vatRate);
  const totalAmountNpr = baseAmountNpr + vatAmountNpr;
  const amount = totalAmountNpr * 100;
  const origin = getSiteOrigin(request);
  const orderId = `pmgo-sa-${ticket.id}-${crypto.randomUUID()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), khaltiRequestTimeoutMs);

  let khaltiResponse: Response;

  try {
    khaltiResponse = await fetch(
      `${khaltiApiBaseUrl.replace(/\/+$/, '')}/epayment/initiate/`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          amount_breakdown: [
            {
              amount,
              label: `${ticket.name} - ${eventDateLabel} x${quantity} incl. VAT`,
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
              name: `${ticket.name} - ${eventDateLabel}`,
              quantity,
              total_price: amount,
              unit_price:
                Math.round(ticket.amountNpr * (1 + ticket.vatRate)) * 100,
            },
          ],
          purchase_order_id: orderId,
          purchase_order_name: `${ticket.name} - ${eventDateLabel}`,
          return_url: `${origin}/tickets/complete`,
          website_url: origin,
        }),
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof DOMException && error.name === 'AbortError'
            ? 'Khalti is taking too long to respond. Please try again in a moment.'
            : 'Khalti could not be reached right now. Please try again.',
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
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
      amountNpr: totalAmountNpr,
      attendeeDetails: attendees
        .map(
          (attendee, index) =>
            `${index + 1}. ${attendee.name} | ${attendee.email} | ${attendee.phone}`,
        )
        .join('\n'),
      baseAmountNpr,
      buyerEmail: customerEmail,
      buyerName: customerName,
      buyerPhone: customerPhone,
      event: 'Checkout Started',
      eventDate,
      eventDateLabel,
      eventDoorsOpen: EVENT_DOORS_OPEN,
      orderId,
      pidx: payload.pidx ?? '',
      quantity,
      status: 'Pending',
      ticketId: ticket.id,
      ticketName: ticket.name,
      totalAmountNpr,
      vatAmountNpr,
    },
    type: 'ticket',
  }).catch(() => null);

  return Response.json({
    paymentUrl: payload.payment_url,
    pidx: payload.pidx,
  });
}

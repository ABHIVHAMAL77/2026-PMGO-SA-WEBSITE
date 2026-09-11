type LookupRequestBody = {
  pidx?: string;
};

const khaltiApiBaseUrl =
  process.env.KHALTI_API_BASE_URL ?? 'https://dev.khalti.com/api/v2';

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

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
    .catch(() => null)) as LookupRequestBody | null;

  const pidx = normalizeText(body?.pidx);

  if (!pidx) {
    return Response.json(
      { error: 'Missing Khalti payment reference.' },
      { status: 400 },
    );
  }

  let khaltiResponse: Response;

  try {
    khaltiResponse = await fetch(
      `${khaltiApiBaseUrl.replace(/\/+$/, '')}/epayment/lookup/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx }),
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

  const payload = (await khaltiResponse.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!khaltiResponse.ok && !payload.status) {
    return Response.json(
      {
        error:
          typeof payload.detail === 'string'
            ? payload.detail
            : 'Khalti payment lookup failed.',
      },
      { status: 502 },
    );
  }

  return Response.json({
    amount: payload.total_amount,
    mobile: payload.mobile,
    pidx: payload.pidx,
    refunded: payload.refunded,
    status: payload.status,
    transactionId: payload.transaction_id,
  });
}

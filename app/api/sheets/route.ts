import { sendSheetRecord } from '@/lib/sheets';

type MediaPayload = {
  fullName?: string;
  gmail?: string;
  instagram?: string;
  nationalId?: string;
  tiktok?: string;
  whatsapp?: string;
  youtube?: string;
};

type SheetRequestBody = {
  payload?: MediaPayload;
  type?: string;
};

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

export function GET() {
  return Response.json({
    configured: Boolean(
      process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim() &&
        process.env.SHEETS_WEBHOOK_SECRET?.trim(),
    ),
  });
}

export async function POST(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as SheetRequestBody | null;

  if (body?.type !== 'media') {
    return Response.json({ error: 'Invalid form type.' }, { status: 400 });
  }

  const payload = body.payload ?? {};
  const application = {
    fullName: normalizeText(payload.fullName),
    gmail: normalizeText(payload.gmail),
    instagram: normalizeText(payload.instagram),
    nationalId: normalizeText(payload.nationalId),
    tiktok: normalizeText(payload.tiktok),
    whatsapp: normalizeText(payload.whatsapp),
    youtube: normalizeText(payload.youtube),
  };

  if (
    !application.fullName ||
    !application.nationalId ||
    !application.gmail ||
    !application.whatsapp
  ) {
    return Response.json(
      { error: 'Please fill the required media application fields.' },
      { status: 400 },
    );
  }

  try {
    const sheetResult = await sendSheetRecord({
      payload: {
        ...application,
        status: 'New',
      },
      type: 'media',
    });

    if (sheetResult.skipped) {
      return Response.json(
        {
          error:
            'Sheet connection is not configured on the server yet.',
        },
        { status: 503 },
      );
    }
  } catch {
    return Response.json(
      {
        error:
          'The application could not be saved right now. Please try again.',
      },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}

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
    await sendSheetRecord({
      payload: {
        ...application,
        status: 'New',
      },
      type: 'media',
    });
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

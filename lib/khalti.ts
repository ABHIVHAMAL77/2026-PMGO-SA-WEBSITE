export const khaltiApiBaseUrl =
  process.env.KHALTI_API_BASE_URL ?? 'https://dev.khalti.com/api/v2';

export const khaltiRequestTimeoutMs = 12_000;

export const getKhaltiSecretKey = () => {
  const rawSecret = process.env.KHALTI_SECRET_KEY;

  if (!rawSecret) {
    return '';
  }

  return rawSecret
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/^key\s+/i, '')
    .trim();
};

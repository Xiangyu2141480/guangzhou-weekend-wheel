export function getDataUrl(
  filename: string,
  baseUrl = import.meta.env.BASE_URL,
): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}data/${filename.replace(/^\/+/, '')}`;
}

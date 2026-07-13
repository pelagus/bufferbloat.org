export function normalizedHeaderText(value: string | null) {
  if (!value) return null;

  try {
    return decodeURIComponent(value).trim().slice(0, 80) || null;
  } catch {
    return value.trim().slice(0, 80) || null;
  }
}

export function locationFromHeaders(headers: Headers) {
  return {
    country: normalizedHeaderText(
      headers.get("x-vercel-ip-country") ||
      headers.get("cf-ipcountry")
    ),
    region: normalizedHeaderText(headers.get("x-vercel-ip-country-region")),
    city: normalizedHeaderText(headers.get("x-vercel-ip-city")),
  };
}

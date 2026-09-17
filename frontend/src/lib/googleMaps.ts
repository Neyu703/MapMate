export function buildGoogleMapsUrl(
  name: string,
  lat: number,
  lon: number,
  address?: string | null,
): string {
  const query = address ? `${name}, ${address}` : `${name} @${lat},${lon}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

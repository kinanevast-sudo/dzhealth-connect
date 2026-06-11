export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function sortByDistance<T extends { lat?: number | null; lng?: number | null }>(
  items: T[],
  origin: { lat: number; lng: number } | null,
): (T & { _distanceKm?: number })[] {
  if (!origin) return items;
  return [...items]
    .map((it) => {
      const lat = it.lat;
      const lng = it.lng;
      if (lat == null || lng == null) return { ...it, _distanceKm: Infinity };
      return { ...it, _distanceKm: haversineKm(origin, { lat, lng }) };
    })
    .sort((a, b) => (a._distanceKm ?? Infinity) - (b._distanceKm ?? Infinity));
}

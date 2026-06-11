export function openMap(lat?: number | null, lng?: number | null, label?: string) {
  let url: string;
  if (lat != null && lng != null && isFinite(lat) && isFinite(lng)) {
    url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  } else if (label) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
  } else {
    return;
  }
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
}

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Loader2, LocateFixed, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const pinIcon = L.divIcon({
  className: "custom-pin",
  html: `<div style="width:34px;height:34px;background:hsl(var(--primary));border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,.35)"></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 15, { duration: 0.6 }); }, [lat, lng, map]);
  return null;
}

export type PickedLocation = {
  lat: number;
  lng: number;
  address?: string;
  baladiya?: string;
  wilaya?: string;
};

export function MapLocationPicker({
  open, onClose, initial, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  initial?: { lat: number; lng: number } | null;
  onConfirm: (loc: PickedLocation) => void;
}) {
  const { t } = useTranslation();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(initial ?? null);
  const [reverse, setReverse] = useState<Omit<PickedLocation, "lat" | "lng"> | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (open && !pos) {
      setLocating(true);
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
          () => { setPos({ lat: 36.7538, lng: 3.0588 }); setLocating(false); },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      } else { setPos({ lat: 36.7538, lng: 3.0588 }); setLocating(false); }
    }
  }, [open]);

  useEffect(() => {
    if (!pos) return;
    let cancelled = false;
    setReverseLoading(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&accept-language=ar,fr`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const a = d.address || {};
        setReverse({
          address: d.display_name,
          baladiya: a.suburb || a.village || a.town || a.city_district || a.municipality || a.city || "",
          wilaya: a.state || a.province || "",
        });
      })
      .catch(() => setReverse(null))
      .finally(() => !cancelled && setReverseLoading(false));
    return () => { cancelled = true; };
  }, [pos]);

  const locateMe = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-black/60 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-bold text-sm">{t("mapLocationPicker.title")}</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="relative flex-1">
              {locating || !pos ? (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <MapContainer center={[pos.lat, pos.lng]} zoom={15} className="h-full w-full" zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
                  <Marker position={[pos.lat, pos.lng]} icon={pinIcon} />
                  <ClickHandler onPick={(lat, lng) => setPos({ lat, lng })} />
                  <FlyTo lat={pos.lat} lng={pos.lng} />
                </MapContainer>
              )}
              <button
                type="button"
                onClick={locateMe}
                className="absolute bottom-4 left-4 z-[1000] w-11 h-11 bg-card border border-border rounded-full flex items-center justify-center shadow-lg"
              >
                <LocateFixed className="w-5 h-5 text-primary" />
              </button>
            </div>
            <div className="p-4 border-t border-border space-y-3">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {reverseLoading ? t("mapLocationPicker.fetching_address") : (
                    <>
                      <div className="font-semibold text-foreground truncate">{reverse?.baladiya || "—"} {reverse?.wilaya ? `· ${reverse.wilaya}` : ""}</div>
                      <div className="truncate">{reverse?.address || `${pos?.lat.toFixed(5)}, ${pos?.lng.toFixed(5)}`}</div>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={!pos}
                onClick={() => pos && onConfirm({ lat: pos.lat, lng: pos.lng, ...(reverse ?? {}) })}
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> {t("mapLocationPicker.confirm_location")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

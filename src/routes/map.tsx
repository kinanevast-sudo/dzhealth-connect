import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Stethoscope, Building2, Pill, X, Phone, Star,
  BadgeCheck, Navigation, Loader2, ChevronRight,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { haversineKm } from "@/lib/geo";

export const Route = createFileRoute("/map")({ component: MapPage });

type Cat = "all" | "doctors" | "hospitals" | "pharmacies";

function createIcon(color: string, emoji: string) {
  return L.divIcon({
    className: "custom-map-marker",
    html: `<div style="width:36px;height:36px;background:${color};border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

const ICONS = {
  doctor: createIcon("#6366f1", "🩺"),
  hospital: createIcon("#3b82f6", "🏥"),
  pharmacy: createIcon("#22c55e", "💊"),
  user: createIcon("#ef4444", "📍"),
};

type Item = {
  id: string;
  type: "doctor" | "hospital" | "pharmacy";
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  phone?: string | null;
  rating?: number | null;
  verified?: boolean;
  detailLink: string;
};

function RecenterButton({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.flyTo([lat, lng], 14, { duration: 0.8 })}
      className="absolute bottom-44 right-4 z-[1000] w-11 h-11 bg-card border border-border rounded-full flex items-center justify-center shadow-lg cursor-pointer"
      aria-label="Recenter"
    >
      <Navigation className="w-4 h-4 text-primary" />
    </button>
  );
}

function fmtKm(km?: number) {
  if (km == null || !isFinite(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`;
}

function MapPage() {
  const [cat, setCat] = useState<Cat>("all");
  const [selected, setSelected] = useState<Item | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: p } = await supabase
          .from("profiles").select("lat,lng").eq("user_id", u.user.id).maybeSingle();
        if (p?.lat && p?.lng) { setOrigin({ lat: p.lat, lng: p.lng }); setLocLoading(false); return; }
      }
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => { setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
          () => { setOrigin({ lat: 36.7538, lng: 3.0588 }); setLocLoading(false); },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
        );
      } else {
        setOrigin({ lat: 36.7538, lng: 3.0588 });
        setLocLoading(false);
      }
    })();
  }, []);

  const { data: doctors = [] } = useQuery({
    queryKey: ["map-doctors"],
    queryFn: async () => {
      const { data } = await supabase.from("doctors")
        .select("id,full_name,rating,phone,lat,lng,verified,specialties(name_ar)")
        .not("lat", "is", null).not("lng", "is", null).limit(200);
      return data ?? [];
    },
  });
  const { data: hospitals = [] } = useQuery({
    queryKey: ["map-hospitals"],
    queryFn: async () => {
      const { data } = await supabase.from("hospitals")
        .select("id,name,phone,lat,lng,wilayas(name_ar)")
        .not("lat", "is", null).not("lng", "is", null).limit(200);
      return data ?? [];
    },
  });
  const { data: pharmacies = [] } = useQuery({
    queryKey: ["map-pharmacies"],
    queryFn: async () => {
      const { data } = await supabase.from("pharmacies")
        .select("id,name,phone,lat,lng,is_24_7,wilayas(name_ar)")
        .not("lat", "is", null).not("lng", "is", null).limit(200);
      return data ?? [];
    },
  });

  const items: Item[] = useMemo(() => {
    const arr: Item[] = [];
    if (cat === "all" || cat === "doctors") {
      for (const d of doctors as any[]) arr.push({
        id: `d-${d.id}`, type: "doctor", name: d.full_name,
        subtitle: d.specialties?.name_ar ?? "طبيب", lat: d.lat, lng: d.lng,
        phone: d.phone, rating: d.rating, verified: d.verified,
        detailLink: `/doctors/${d.id}`,
      });
    }
    if (cat === "all" || cat === "hospitals") {
      for (const h of hospitals as any[]) arr.push({
        id: `h-${h.id}`, type: "hospital", name: h.name,
        subtitle: h.wilayas?.name_ar ?? "مستشفى", lat: h.lat, lng: h.lng,
        phone: h.phone, detailLink: `/hospitals`,
      });
    }
    if (cat === "all" || cat === "pharmacies") {
      for (const p of pharmacies as any[]) arr.push({
        id: `p-${p.id}`, type: "pharmacy", name: p.name,
        subtitle: (p.is_24_7 ? "صيدلية 24/7 · " : "صيدلية · ") + (p.wilayas?.name_ar ?? ""),
        lat: p.lat, lng: p.lng, phone: p.phone, detailLink: `/pharmacies`,
      });
    }
    return arr;
  }, [cat, doctors, hospitals, pharmacies]);

  const center: [number, number] = origin ? [origin.lat, origin.lng] : [36.7538, 3.0588];
  const distanceKm = selected && origin ? haversineKm(origin, { lat: selected.lat, lng: selected.lng }) : undefined;

  const chips: { id: Cat; label: string; icon: any; color: string }[] = [
    { id: "all", label: "الكل", icon: MapPin, color: "bg-primary" },
    { id: "doctors", label: "أطباء", icon: Stethoscope, color: "bg-indigo-500" },
    { id: "hospitals", label: "مستشفيات", icon: Building2, color: "bg-blue-500" },
    { id: "pharmacies", label: "صيدليات", icon: Pill, color: "bg-green-500" },
  ];

  return (
    <AppShell>
      <div dir="rtl" className="relative h-[100dvh] w-full overflow-hidden bg-background">
        {locLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <MapContainer center={center} zoom={13} className="absolute inset-0 z-0" zoomControl={false}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            {origin && <Marker position={[origin.lat, origin.lng]} icon={ICONS.user} />}
            {items.map((it) => (
              <Marker
                key={it.id}
                position={[it.lat, it.lng]}
                icon={ICONS[it.type]}
                eventHandlers={{ click: () => setSelected(it) }}
              />
            ))}
            {origin && <RecenterButton lat={origin.lat} lng={origin.lng} />}
          </MapContainer>
        )}

        {/* Top chips */}
        <div className="absolute top-0 left-0 right-0 z-[1000] pt-12 pb-3 px-4 bg-gradient-to-b from-background/95 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/home" className="w-9 h-9 bg-card border border-border rounded-xl flex items-center justify-center cursor-pointer">
              <ChevronRight className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="font-black text-base text-foreground">الخريطة</h1>
            <span className="text-xs text-muted-foreground mr-auto">{items.length} نتيجة</span>
          </div>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {chips.map((c) => {
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-bold flex-shrink-0 border transition-colors cursor-pointer ${
                    active ? `${c.color} text-white border-transparent` : "bg-card text-foreground border-border"
                  }`}
                >
                  <c.icon className="w-3.5 h-3.5" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom sheet */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="absolute bottom-24 left-3 right-3 z-[1000] bg-card border border-border rounded-2xl shadow-2xl p-4"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 left-3 w-8 h-8 rounded-full bg-secondary flex items-center justify-center cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex gap-3 items-start">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  selected.type === "doctor" ? "bg-indigo-500/15" : selected.type === "hospital" ? "bg-blue-500/15" : "bg-green-500/15"
                }`}>
                  {selected.type === "doctor" ? "🩺" : selected.type === "hospital" ? "🏥" : "💊"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm text-foreground truncate">{selected.name}</h3>
                    {selected.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{selected.subtitle}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    {selected.rating != null && (
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-current" /> {Number(selected.rating).toFixed(1)}
                      </span>
                    )}
                    {fmtKm(distanceKm) && (
                      <span className="flex items-center gap-1 text-primary font-bold">
                        <MapPin className="w-3 h-3" /> {fmtKm(distanceKm)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Link
                  to={selected.detailLink as any}
                  className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  عرض التفاصيل
                </Link>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center cursor-pointer">
                    <Phone className="w-4 h-4 text-primary" />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

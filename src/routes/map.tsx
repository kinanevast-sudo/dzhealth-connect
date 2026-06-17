import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Stethoscope, Building2, Pill, X, Phone, Star,
  BadgeCheck, Navigation, Loader2, ChevronRight, Car, Footprints, Route as RouteIcon,
  FlaskConical, HandHeart, Truck, Shield,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Tooltip, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { haversineKm } from "@/lib/geo";

export const Route = createFileRoute("/map")({ component: MapPage, ssr: false });

type Cat = "all" | "doctors" | "hospitals" | "pharmacies" | "oncall" | "labs" | "charities" | "ambulances" | "civil";
type Profile = "driving" | "foot";

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
  lab: createIcon("#7c3aed", "🧪"),
  charity: createIcon("#f59e0b", "🤝"),
  ambulance: createIcon("#dc2626", "🚑"),
  civil: createIcon("#ea580c", "🛡️"),
  user: createIcon("#ef4444", "📍"),
};

type ItemType = "doctor" | "hospital" | "pharmacy" | "lab" | "charity" | "ambulance" | "civil";
type Item = {
  id: string;
  type: ItemType;
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
      onClick={() => map.flyTo([lat, lng], 15, { duration: 0.8 })}
      className="absolute bottom-44 right-4 z-[1000] w-11 h-11 bg-card border border-border rounded-full flex items-center justify-center shadow-lg cursor-pointer"
      aria-label="موقعي"
    >
      <Navigation className="w-4 h-4 text-primary" />
    </button>
  );
}

function FitBounds({ points }: { points: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length < 2) return;
    const b = L.latLngBounds(points);
    map.fitBounds(b, { padding: [60, 60], maxZoom: 16 });
  }, [points, map]);
  return null;
}

function fmtKm(km?: number) {
  if (km == null || !isFinite(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`;
}
function fmtDur(sec?: number) {
  if (sec == null || !isFinite(sec)) return null;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} د`;
  const h = Math.floor(m / 60); const r = m % 60;
  return `${h}س ${r}د`;
}

function MapPage() {
  const [cat, setCat] = useState<Cat>("all");
  const [selected, setSelected] = useState<Item | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>("driving");
  const [route, setRoute] = useState<{ coords: [number, number][]; distance: number; duration: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const requestLocation = () => {
    setLocLoading(true);
    setLocError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocError("الموقع الجغرافي غير مدعوم على هذا الجهاز");
      setOrigin({ lat: 36.7538, lng: 3.0588 });
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      (err) => {
        setLocError(err.code === 1 ? "تم رفض الإذن. فعّل الموقع من إعدادات المتصفح." : "تعذّر تحديد موقعك");
        setOrigin({ lat: 36.7538, lng: 3.0588 });
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

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
  const { data: labs = [] } = useQuery({
    queryKey: ["map-labs"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("labs")
        .select("id,name,phone,lat,lng,wilayas(name_ar)")
        .not("lat", "is", null).not("lng", "is", null).limit(200);
      return data ?? [];
    },
  });
  const { data: charities = [] } = useQuery({
    queryKey: ["map-charities"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("charities")
        .select("id,name,phone,lat,lng,wilayas(name_ar)")
        .not("lat", "is", null).not("lng", "is", null).limit(200);
      return data ?? [];
    },
  });
  const { data: ambulances = [] } = useQuery({
    queryKey: ["map-ambulances"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("ambulances")
        .select("id,name,phone,lat,lng,is_24_7,wilayas(name_ar)")
        .not("lat", "is", null).not("lng", "is", null).limit(200);
      return data ?? [];
    },
  });
  const { data: civils = [] } = useQuery({
    queryKey: ["map-civil"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("civil_protection_centers")
        .select("id,name,phone,lat,lng,wilayas(name_ar)")
        .not("lat", "is", null).not("lng", "is", null).limit(200);
      return data ?? [];
    },
  });

  const allItems: Item[] = useMemo(() => {
    const arr: Item[] = [];
    for (const d of doctors as any[]) arr.push({
      id: `d-${d.id}`, type: "doctor", name: d.full_name,
      subtitle: d.specialties?.name_ar ?? "طبيب", lat: d.lat, lng: d.lng,
      phone: d.phone, rating: d.rating, verified: d.verified,
      detailLink: `/doctors/${d.id}`,
    });
    for (const h of hospitals as any[]) arr.push({
      id: `h-${h.id}`, type: "hospital", name: h.name,
      subtitle: h.wilayas?.name_ar ?? "مستشفى", lat: h.lat, lng: h.lng,
      phone: h.phone, detailLink: `/hospitals`,
    });
    for (const p of pharmacies as any[]) arr.push({
      id: `p-${p.id}`, type: "pharmacy", name: p.name,
      subtitle: (p.is_24_7 ? "صيدلية 24/7 · " : "صيدلية · ") + (p.wilayas?.name_ar ?? ""),
      lat: p.lat, lng: p.lng, phone: p.phone, detailLink: `/pharmacies`,
    });
    for (const l of labs as any[]) arr.push({
      id: `l-${l.id}`, type: "lab", name: l.name,
      subtitle: "مخبر تحاليل · " + (l.wilayas?.name_ar ?? ""),
      lat: l.lat, lng: l.lng, phone: l.phone, detailLink: `/search`,
    });
    for (const c of charities as any[]) arr.push({
      id: `c-${c.id}`, type: "charity", name: c.name,
      subtitle: "جمعية خيرية · " + (c.wilayas?.name_ar ?? ""),
      lat: c.lat, lng: c.lng, phone: c.phone, detailLink: `/search`,
    });
    for (const a of ambulances as any[]) arr.push({
      id: `a-${a.id}`, type: "ambulance", name: a.name,
      subtitle: (a.is_24_7 ? "إسعاف 24/7 · " : "إسعاف · ") + (a.wilayas?.name_ar ?? ""),
      lat: a.lat, lng: a.lng, phone: a.phone, detailLink: `/search`,
    });
    for (const cv of civils as any[]) arr.push({
      id: `cv-${cv.id}`, type: "civil", name: cv.name,
      subtitle: "حماية مدنية · " + (cv.wilayas?.name_ar ?? ""),
      lat: cv.lat, lng: cv.lng, phone: cv.phone, detailLink: `/civil-protection`,
    });
    return arr;
  }, [doctors, hospitals, pharmacies, labs, charities, ambulances, civils]);

  // Filter by category + sort by real distance and keep nearest 50
  const items: Item[] = useMemo(() => {
    const filtered = allItems.filter((it) => {
      if (cat === "all") return true;
      if (cat === "doctors") return it.type === "doctor";
      if (cat === "hospitals") return it.type === "hospital";
      if (cat === "pharmacies") return it.type === "pharmacy";
      if (cat === "labs") return it.type === "lab";
      if (cat === "charities") return it.type === "charity";
      if (cat === "ambulances") return it.type === "ambulance";
      if (cat === "civil") return it.type === "civil";
      return true;
    });
    if (!origin) return filtered;
    return filtered
      .map((it) => ({ it, d: haversineKm(origin, { lat: it.lat, lng: it.lng }) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 80)
      .map((x) => x.it);
  }, [allItems, cat, origin]);

  // Compute route via OSRM when selection or profile changes
  useEffect(() => {
    setRoute(null);
    if (!selected || !origin) return;
    let cancelled = false;
    setRouteLoading(true);
    const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${selected.lng},${selected.lat}?overview=full&geometries=geojson`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const r0 = d?.routes?.[0];
        if (!r0) return;
        const coords: [number, number][] = r0.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        setRoute({ coords, distance: r0.distance / 1000, duration: r0.duration });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setRouteLoading(false); });
    return () => { cancelled = true; };
  }, [selected, origin, profile]);

  const center: [number, number] = origin ? [origin.lat, origin.lng] : [36.7538, 3.0588];
  const distanceKm = selected && origin ? haversineKm(origin, { lat: selected.lat, lng: selected.lng }) : undefined;

  const chips: { id: Cat; label: string; icon: any; color: string }[] = [
    { id: "all", label: "الكل", icon: MapPin, color: "bg-primary" },
    { id: "doctors", label: "أطباء", icon: Stethoscope, color: "bg-indigo-500" },
    { id: "hospitals", label: "مستشفيات", icon: Building2, color: "bg-blue-500" },
    { id: "pharmacies", label: "صيدليات", icon: Pill, color: "bg-green-500" },
    { id: "labs", label: "مخابر", icon: FlaskConical, color: "bg-violet-500" },
    { id: "charities", label: "جمعيات", icon: HandHeart, color: "bg-amber-500" },
    { id: "ambulances", label: "إسعاف", icon: Truck, color: "bg-red-600" },
    { id: "civil", label: "حماية مدنية", icon: Shield, color: "bg-orange-600" },
  ];

  const openExternalNav = () => {
    if (!selected || !origin) return;
    const travel = profile === "foot" ? "walking" : "driving";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${selected.lat},${selected.lng}&travelmode=${travel}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AppShell>
      <div dir="rtl" className="relative h-[100dvh] w-full overflow-hidden bg-background">
        {locLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">جارٍ تحديد موقعك...</p>
          </div>
        ) : (
          <MapContainer center={center} zoom={14} className="absolute inset-0 z-0" zoomControl={false}>
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
            {route && (
              <>
                <Polyline positions={route.coords} pathOptions={{ color: "#ffffff", weight: 8, opacity: 0.85 }} />
                <Polyline positions={route.coords} pathOptions={{ color: "hsl(var(--primary))", weight: 5, opacity: 1 }} />
                <FitBounds points={route.coords} />
              </>
            )}
            {origin && <RecenterButton lat={origin.lat} lng={origin.lng} />}
          </MapContainer>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-[1000] pt-12 pb-3 px-4 bg-gradient-to-b from-background/95 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/home" className="w-9 h-9 bg-card border border-border rounded-xl flex items-center justify-center cursor-pointer">
              <ChevronRight className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="font-black text-base text-foreground">الخريطة</h1>
            <span className="text-xs text-muted-foreground mr-auto">{items.length} قريبة</span>
          </div>
          {locError && (
            <div className="mb-2 flex items-center justify-between gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs rounded-xl px-3 py-2">
              <span className="truncate">{locError}</span>
              <button onClick={requestLocation} className="font-bold underline shrink-0">إعادة المحاولة</button>
            </div>
          )}
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
              initial={{ y: 320, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="absolute bottom-24 left-3 right-3 z-[1000] bg-card border border-border rounded-2xl shadow-2xl p-4"
            >
              <button
                onClick={() => { setSelected(null); setRoute(null); }}
                className="absolute top-3 left-3 w-8 h-8 rounded-full bg-secondary flex items-center justify-center cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex gap-3 items-start">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  selected.type === "doctor" ? "bg-indigo-500/15" :
                  selected.type === "hospital" ? "bg-blue-500/15" :
                  selected.type === "pharmacy" ? "bg-green-500/15" :
                  selected.type === "lab" ? "bg-violet-500/15" :
                  selected.type === "charity" ? "bg-amber-500/15" :
                  selected.type === "ambulance" ? "bg-red-600/15" :
                  "bg-orange-600/15"
                }`}>
                  {selected.type === "doctor" ? "🩺" :
                   selected.type === "hospital" ? "🏥" :
                   selected.type === "pharmacy" ? "💊" :
                   selected.type === "lab" ? "🧪" :
                   selected.type === "charity" ? "🤝" :
                   selected.type === "ambulance" ? "🚑" : "🛡️"}
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

              {/* Profile toggle + route stats */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex bg-secondary rounded-xl p-1">
                  <button
                    onClick={() => setProfile("driving")}
                    className={`flex items-center gap-1 px-3 h-8 rounded-lg text-xs font-bold transition-colors ${profile === "driving" ? "bg-card text-primary shadow" : "text-muted-foreground"}`}
                  >
                    <Car className="w-3.5 h-3.5" /> سيارة
                  </button>
                  <button
                    onClick={() => setProfile("foot")}
                    className={`flex items-center gap-1 px-3 h-8 rounded-lg text-xs font-bold transition-colors ${profile === "foot" ? "bg-card text-primary shadow" : "text-muted-foreground"}`}
                  >
                    <Footprints className="w-3.5 h-3.5" /> مشي
                  </button>
                </div>
                <div className="flex-1 text-xs text-muted-foreground flex items-center gap-1.5">
                  <RouteIcon className="w-3.5 h-3.5 text-primary" />
                  {routeLoading ? "حساب المسار..." :
                    route ? <span className="font-bold text-foreground">{fmtKm(route.distance)} · {fmtDur(route.duration)}</span> :
                    !origin ? "فعّل الموقع لحساب المسار" : "—"}
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={openExternalNav}
                  disabled={!origin}
                  className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  <Navigation className="w-4 h-4" /> ابدأ التوجيه
                </button>
                <Link
                  to={selected.detailLink as any}
                  className="flex-1 h-10 bg-secondary text-foreground rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  التفاصيل
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

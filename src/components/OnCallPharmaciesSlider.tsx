import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Phone, MapPin, ChevronLeft, Clock, Map as MapIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sortByDistance } from "@/lib/geo";
import { openMap } from "@/lib/map";

const MotionLink = motion(Link);

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fmtKm(km?: number) {
  if (km == null || !isFinite(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`;
}

export function OnCallPharmaciesSlider({ origin }: { origin: { lat: number; lng: number } | null }) {
  const [index, setIndex] = useState(0);

  const { data = [] } = useQuery({
    queryKey: ["on-call-home", todayISO()],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("pharmacy_on_call")
        .select("pharmacies(id,name,phone,lat,lng,is_24_7,wilayas(name_ar),baladiyas(name_ar))")
        .eq("on_call_date", todayISO());
      return (data ?? []).map((r: any) => r.pharmacies).filter(Boolean);
    },
    staleTime: 60_000,
  });

  const sorted = sortByDistance(data as any, origin).slice(0, 5);

  useEffect(() => {
    if (sorted.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % sorted.length), 4500);
    return () => clearInterval(t);
  }, [sorted.length]);

  if (sorted.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-black text-base text-foreground flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-green-600" />
            الصيدليات المناوبة اليوم
          </h2>
          <Link to="/on-call-pharmacies" className="text-primary text-xs font-medium flex items-center gap-1">
            عرض الكل <ChevronLeft className="w-3 h-3" />
          </Link>
        </div>
        <div className="bg-card border border-border rounded-2xl px-4 py-6 text-center">
          <Pill className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">لا توجد صيدليات مناوبة مسجلة لهذا اليوم</p>
        </div>
      </section>
    );
  }
  const p: any = sorted[index % sorted.length];
  const dist = fmtKm(p._distanceKm);

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-black text-base text-foreground flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-green-600" />
          الصيدليات المناوبة اليوم
        </h2>
        <Link to="/on-call-pharmacies" className="text-primary text-xs font-medium flex items-center gap-1">
          عرض الكل <ChevronLeft className="w-3 h-3" />
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <MotionLink
            to="/pharmacies/$id"
            params={{ id: p.id } as any}
            key={p.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.45 }}
            className="relative bg-gradient-to-br from-green-700/30 via-emerald-900/70 to-teal-900/40 border border-green-600/50 rounded-2xl px-4 py-3 ring-2 ring-green-500/30 shadow-[0_8px_40px_-8px_rgba(34,197,94,0.45)] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 border-2 border-green-600/60">
                <Pill className="w-6 h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-foreground truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {p.baladiyas?.name_ar ? `${p.baladiyas.name_ar} - ` : ""}{p.wilayas?.name_ar ?? ""}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-600 text-white">مناوبة اليوم</span>
                  {dist && <span className="text-[11px] font-bold text-green-200">{dist}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              {p.phone && (
                <a href={`tel:${p.phone}`} onClick={(e) => e.stopPropagation()} className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center active:scale-95" aria-label="اتصال">
                  <Phone className="w-4 h-4" />
                </a>
              )}
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openMap(p.lat, p.lng, p.name); }} className="w-10 h-10 rounded-xl bg-cyan-700 text-white flex items-center justify-center active:scale-95" aria-label="الخريطة">
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </MotionLink>
        </AnimatePresence>

        {sorted.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {sorted.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`بطاقة ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-green-500" : "w-1.5 bg-muted-foreground/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


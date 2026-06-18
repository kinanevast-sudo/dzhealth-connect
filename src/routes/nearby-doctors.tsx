import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MapPin, Star, BadgeCheck, Loader2, Map as MapIcon, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { sortByDistance } from "@/lib/geo";
import { openMap } from "@/lib/map";

export const Route = createFileRoute("/nearby-doctors")({ component: Page });

function Page() {
  const { t } = useTranslation();
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [geoErrorKey, setGeoErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocating(false);
      setGeoErrorKey("nearby-doctors.geoNotSupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setGeoErrorKey("nearby-doctors.geoPermissionDenied");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["nearby-doctors-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("doctors")
        .select("id,full_name,rating,reviews_count,photo_url,fee,verified,phone,lat,lng,specialties(name_ar),wilayas(name_ar),baladiyas(name_ar)")
        .limit(100);
      return data ?? [];
    },
  });

  const sorted = sortByDistance((data ?? []) as any[], origin).filter(
    (d: any) => isFinite(d._distanceKm ?? Infinity)
  );

  function fmtKm(km?: number) {
    if (km == null || !isFinite(km)) return null;
    return km < 1 ? `${Math.round(km * 1000)} ${t("nearby-doctors.meterUnit")}` : `${km.toFixed(1)} ${t("nearby-doctors.kmUnit")}`;
  }

  return (
    <AppShell>
      <ScreenHeader title={t("nearby-doctors.title")} />
      <div dir="rtl" className="px-4 pb-24">
        <div className="mt-2 mb-4 rounded-2xl bg-primary/5 border border-primary/20 px-3 py-2.5 flex items-center gap-2">
          {locating ? (
            <>
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">{t("nearby-doctors.locating")}</span>
            </>
          ) : geoErrorKey ? (
            <>
              <MapPin className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-600">{t(geoErrorKey)}</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs text-foreground font-semibold">
                {t("nearby-doctors.distanceInfo", { count: sorted.length })}
              </span>
            </>
          )}
        </div>

        {(isLoading || locating) && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && !locating && sorted.length === 0 && (
          <div className="rounded-2xl bg-card border border-border p-8 text-center text-sm text-muted-foreground">
            {t("nearby-doctors.noResults")}
          </div>
        )}

        <div className="space-y-3">
          {!isLoading && !locating && sorted.map((d: any, i: number) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.3 }}
            >
              <DoctorNearbyRow d={d} fmtKm={fmtKm} />
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function DoctorNearbyRow({ d, fmtKm }: { d: any; fmtKm: (km?: number) => string | null }) {
  const { t } = useTranslation();
  const dist = fmtKm(d._distanceKm);
  return (
    <div className="bg-card rounded-2xl border border-border p-3">
      <Link to="/doctors/$id" params={{ id: d.id }} className="flex items-start gap-3 active:scale-[0.99] transition">
        <div className="relative shrink-0">
          {d.photo_url ? (
            <img src={d.photo_url} alt={d.full_name} className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary text-2xl font-bold">د</div>
          )}
          {d.verified && (
            <div className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
              <BadgeCheck className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold leading-tight text-foreground truncate">{d.full_name}</h3>
          <p className="mt-0.5 text-sm font-semibold text-primary truncate">{d.specialties?.name_ar}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {d.wilayas?.name_ar}{d.baladiyas?.name_ar ? ` - ${d.baladiyas.name_ar}` : ""}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="font-bold">{d.rating}</span>
              <span className="text-muted-foreground">({d.reviews_count ?? 0})</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-black text-primary">
              <MapPin className="h-3 w-3" />
              {dist ?? "—"}
            </span>
          </div>
        </div>
      </Link>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-2.5" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => openMap(d.lat, d.lng, d.full_name)}
          className="flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold bg-primary text-primary-foreground active:scale-95 transition"
        >
          <MapIcon className="w-3.5 h-3.5" /> {t("nearby-doctors.viewOnMap")}
        </button>
        <a
          href={d.phone ? `tel:${d.phone}` : "#"}
          onClick={(e) => { if (!d.phone) e.preventDefault(); }}
          className="flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold bg-primary/10 text-primary active:scale-95 transition"
        >
          <Phone className="w-3.5 h-3.5" /> {t("nearby-doctors.call")}
        </a>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Building2, Phone, MapPin, Search, Map as MapIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { sortByDistance } from "@/lib/geo";
import { openMap } from "@/lib/map";

export const Route = createFileRoute("/hospitals")({ component: Page });

const PAGE = 10;

function Page() {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: u }) => {
      if (!u.user) return;
      supabase.from("profiles").select("lat,lng").eq("user_id", u.user.id).maybeSingle()
        .then(({ data }) => { if (data?.lat && data?.lng) setOrigin({ lat: data.lat, lng: data.lng }); });
    });
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hospitals-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hospitals")
        .select("id,name,kind,phone,photo_url,lat,lng,wilayas(name_ar),baladiyas(name_ar)");
      if (error) throw error;
      return data ?? [];
    },
    retry: 1,
    staleTime: 60_000,
  });

  const filtered = (data ?? []).filter((h: any) =>
    !q || h.name.toLowerCase().includes(q.toLowerCase()) ||
    h.wilayas?.name_ar?.includes(q) || h.baladiyas?.name_ar?.includes(q)
  );
  const sorted = sortByDistance(filtered, origin);
  const visible = showAll ? sorted : sorted.slice(0, PAGE);
  const hasMore = sorted.length > PAGE;

  return (
    <AppShell>
      <ScreenHeader title="المستشفيات" />
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 rounded-2xl bg-surface card-elevated px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن مستشفى..."
            className="w-full bg-transparent text-right text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{sorted.length} مستشفى</span>
          <span>مستشفيات قريبة</span>
        </div>

        <div className="mt-3 space-y-3">
          {isLoading && Array.from({ length: 5 }).map((_, i) => <HospitalSkeleton key={i} />)}
          {!isLoading && isError && (
            <div className="rounded-2xl bg-surface card-elevated p-8 text-center text-sm text-muted-foreground">
              <p>تعذّر تحميل المستشفيات. تحقق من الاتصال بالإنترنت.</p>
              <button onClick={() => refetch()} className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
                إعادة المحاولة
              </button>
            </div>
          )}
          {!isLoading && !isError && visible.map((h: any) => <HospitalCard key={h.id} h={h} />)}
          {!isLoading && !isError && visible.length === 0 && (
            <div className="rounded-2xl bg-surface card-elevated p-8 text-center text-sm text-muted-foreground">
              لا توجد نتائج
            </div>
          )}
        </div>

        {hasMore && (
          <button
            onClick={() => setShowAll((s) => !s)}
            className="mt-4 w-full rounded-2xl gradient-primary py-3 text-sm font-bold text-primary-foreground neon-glow"
          >
            {showAll ? "عرض أقل" : `عرض الكل (${sorted.length})`}
          </button>
        )}
        <div className="h-6" />
      </div>
    </AppShell>
  );
}

function fmtKm(km?: number) {
  if (km == null || !isFinite(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`;
}

function HospitalSkeleton() {
  return (
    <div className="flex items-stretch gap-3 rounded-2xl bg-surface card-elevated p-3">
      <div className="h-24 w-28 flex-shrink-0 animate-pulse rounded-xl bg-surface-2" />
      <div className="flex-1 space-y-2 py-1">
        <div className="ms-auto h-4 w-3/4 animate-pulse rounded bg-surface-2" />
        <div className="ms-auto h-3 w-1/2 animate-pulse rounded bg-surface-2" />
        <div className="ms-auto h-3 w-2/3 animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}

function HospitalImg({ src, alt }: { src?: string | null; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="flex h-24 w-28 flex-shrink-0 items-center justify-center rounded-xl bg-surface-2">
        <Building2 className="h-10 w-10 text-primary" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)} className="h-24 w-28 flex-shrink-0 rounded-xl object-cover" />;
}

function HospitalCard({ h }: { h: any }) {
  const km = fmtKm((h as any)._distanceKm);
  return (
    <Link to="/hospitals" className="block rounded-2xl p-4 active:scale-[0.98] transition" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-3">
        <HospitalImg src={h.photo_url} alt={h.name} />
        <div className="min-w-0 flex-1 text-right">
          <h3 className="text-base font-extrabold leading-tight">{h.name}</h3>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: "#0891b2" }}>{h.kind ?? "مستشفى عام"}</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <span>{h.wilayas?.name_ar}{h.baladiyas?.name_ar ? ` - ${h.baladiyas?.name_ar}` : ""}</span>
            <MapPin className="h-3 w-3" />
          </div>
          <div className="mt-2 flex flex-wrap justify-end gap-1.5">
            {["طوارئ","جراحة","أطفال"].map((t) => (
              <span key={t} className="rounded-full px-2.5 py-0.5 text-[10px]" style={{ background: "#cffafe", color: "#0891b2" }}>{t}</span>
            ))}
          </div>
          {km && (
            <div className="mt-2 flex items-center justify-end">
              <span className="text-xs font-bold" style={{ color: "#0891b2" }}>{km}</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openMap(h.lat, h.lng, h.name); }} className="flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold text-white" style={{ background: "#0e7490" }}>
          <MapIcon className="h-4 w-4" /> عرض على الخريطة
        </button>
        <a href={`tel:${h.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold" style={{ background: "#e0f2fe", color: "#0891b2" }}>
          <Phone className="h-4 w-4" /> اتصال
        </a>
      </div>
    </Link>
  );
}


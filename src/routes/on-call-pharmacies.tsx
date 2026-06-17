import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pill, Phone, MapPin, Map as MapIcon, Navigation, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { SearchInput } from "@/components/SearchInput";
import { openMap } from "@/lib/map";
import { sortByDistance } from "@/lib/geo";

export const Route = createFileRoute("/on-call-pharmacies")({ component: Page });

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function Page() {
  const [q, setQ] = useState("");
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => { setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocLoading(false); },
      () => setLocLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["on-call-pharmacies", todayISO()],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("pharmacy_on_call")
        .select("shift_type, pharmacy_id, on_call_date, pharmacies(id,name,phone,lat,lng,is_24_7,photo_url,wilayas(name_ar),baladiyas(name_ar))")
        .eq("on_call_date", todayISO());
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ ...r.pharmacies, shift_type: r.shift_type })).filter((x: any) => x.id);
    },
    staleTime: 60_000,
  });

  const filtered = (data ?? []).filter((p: any) =>
    !q || p.name?.toLowerCase().includes(q.toLowerCase()) ||
    p.wilayas?.name_ar?.includes(q) || p.baladiyas?.name_ar?.includes(q)
  );
  const sorted = sortByDistance(filtered as any, origin);

  return (
    <AppShell>
      <ScreenHeader title="الصيدليات المناوبة اليوم" />
      <div className="px-4 pt-3 pb-6">
        <SearchInput value={q} onChange={setQ} placeholder="ابحث عن صيدلية مناوبة..." />

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{sorted.length} صيدلية مناوبة</span>
          {locLoading ? (
            <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> تحديد الموقع</span>
          ) : origin ? (
            <span className="flex items-center gap-1"><Navigation className="w-3 h-3 text-primary" /> مُرتّب حسب الأقرب</span>
          ) : <span>الموقع غير متاح</span>}
        </div>

        <div className="mt-3 space-y-3">
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface-2 animate-pulse" />
          ))}
          {!isLoading && isError && (
            <div className="rounded-2xl bg-surface card-elevated p-8 text-center text-sm text-muted-foreground">
              <p>تعذّر تحميل الصيدليات المناوبة.</p>
              <button onClick={() => refetch()} className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">إعادة المحاولة</button>
            </div>
          )}
          {!isLoading && !isError && sorted.map((p: any) => (
            <Card key={p.id} p={p} onMap={() => openMap(p.lat, p.lng, p.name)} />
          ))}
          {!isLoading && !isError && sorted.length === 0 && (
            <div className="rounded-2xl bg-surface card-elevated p-8 text-center text-sm text-muted-foreground">لا توجد صيدليات مناوبة اليوم</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Card({ p, onMap }: { p: any; onMap: () => void }) {
  const dist = p._distanceKm;
  const distLabel = dist != null && isFinite(dist) ? (dist < 1 ? `${Math.round(dist * 1000)} م` : `${dist.toFixed(1)} كم`) : null;
  return (
    <Link to="/pharmacies/$id" params={{ id: p.id }} className="block rounded-2xl p-4 active:scale-[0.98] transition" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-3">
        {p.photo_url ? (
          <img src={p.photo_url} alt={p.name} loading="lazy" className="h-20 w-20 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: "color-mix(in oklab, var(--success) 25%, transparent)" }}>
            <Pill className="h-8 w-8 text-success" />
          </div>
        )}
        <div className="min-w-0 flex-1 text-right">
          <h3 className="text-base font-extrabold leading-tight">{p.name}</h3>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: "#0891b2" }}>صيدلية مناوبة</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <span>{p.wilayas?.name_ar}{p.baladiyas?.name_ar ? ` - ${p.baladiyas.name_ar}` : ""}</span>
            <MapPin className="h-3 w-3" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            {distLabel && <span className="text-xs font-bold" style={{ color: "#0891b2" }}>{distLabel}</span>}
            <div className="flex gap-1.5">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-red-500/15 text-red-600">مناوبة اليوم</span>
              {p.is_24_7 && (
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: "color-mix(in oklab, var(--success) 25%, transparent)", color: "var(--success)" }}>24/7</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMap(); }} className="flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold text-white" style={{ background: "#0e7490" }}>
          <MapIcon className="h-4 w-4" /> موقع على الخريطة
        </button>
        <a href={p.phone ? `tel:${p.phone}` : "#"} onClick={(e) => { if (!p.phone) e.preventDefault(); e.stopPropagation(); }} className="flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold" style={{ background: "#e0f2fe", color: "#0891b2" }}>
          <Phone className="h-4 w-4" /> اتصال
        </a>
      </div>
    </Link>
  );
}

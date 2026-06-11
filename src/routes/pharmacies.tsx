import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pill, Phone, MapPin, Search, Map as MapIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { SearchInput } from "@/components/SearchInput";
import { openMap } from "@/lib/map";

export const Route = createFileRoute("/pharmacies")({ component: Page });

function Page() {
  const [q, setQ] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["pharmacies-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacies")
        .select("id,name,phone,lat,lng,is_24_7,wilayas(name_ar),baladiyas(name_ar)");
      if (error) throw error;
      return data ?? [];
    },
    retry: 1,
    staleTime: 60_000,
  });

  const filtered = (data ?? []).filter((p: any) =>
    !q || p.name?.toLowerCase().includes(q.toLowerCase()) ||
    p.wilayas?.name_ar?.includes(q) || p.baladiyas?.name_ar?.includes(q)
  );

  return (
    <AppShell>
      <ScreenHeader title="الصيدليات" />
      <div className="px-4 pt-3 pb-6">
        <SearchInput value={q} onChange={setQ} placeholder="ابحث عن صيدلية..." />

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} صيدلية</span>
          <span>صيدليات قريبة</span>
        </div>

        <div className="mt-3 space-y-3">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <PharmacySkeleton key={i} />)}
          {!isLoading && isError && (
            <div className="rounded-2xl bg-surface card-elevated p-8 text-center text-sm text-muted-foreground">
              <p>تعذّر تحميل الصيدليات. تحقق من الاتصال بالإنترنت.</p>
              <button onClick={() => refetch()} className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">إعادة المحاولة</button>
            </div>
          )}
          {!isLoading && !isError && filtered.map((p: any) => <PharmacyCard key={p.id} p={p} onMap={() => openMap(p.lat, p.lng, p.name)} />)}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="rounded-2xl bg-surface card-elevated p-8 text-center text-sm text-muted-foreground">لا توجد نتائج</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function PharmacyImg({ src, alt }: { src?: string | null; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: "color-mix(in oklab, var(--success) 25%, transparent)" }}>
        <Pill className="h-8 w-8 text-success" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)} className="h-20 w-20 rounded-2xl object-cover" />;
}

function PharmacyCard({ p, onMap }: { p: any; onMap: () => void }) {
  return (
    <Link to="/pharmacies" className="block rounded-2xl p-4 active:scale-[0.98] transition" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-3">
        <PharmacyImg src={p.photo_url} alt={p.name} />
        <div className="min-w-0 flex-1 text-right">
          <h3 className="text-base font-extrabold leading-tight">{p.name}</h3>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: "#0891b2" }}>صيدلية</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <span>{p.wilayas?.name_ar}{p.baladiyas?.name_ar ? ` - ${p.baladiyas?.name_ar}` : ""}</span>
            <MapPin className="h-3 w-3" />
          </div>
          {p.is_24_7 && (
            <div className="mt-2 flex justify-end">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: "color-mix(in oklab, var(--success) 25%, transparent)", color: "var(--success)" }}>24/7</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMap(); }} className="flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold text-white" style={{ background: "#0e7490" }}>
          <MapIcon className="h-4 w-4" /> عرض على الخريطة
        </button>
        <a href={`tel:${p.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold" style={{ background: "#e0f2fe", color: "#0891b2" }}>
          <Phone className="h-4 w-4" /> اتصال
        </a>
      </div>
    </Link>
  );
}

function PharmacySkeleton() {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 animate-pulse rounded-2xl bg-surface-2" />
        <div className="flex-1 space-y-2 py-1">
          <div className="ms-auto h-4 w-3/4 animate-pulse rounded bg-surface-2" />
          <div className="ms-auto h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          <div className="ms-auto h-3 w-2/3 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <div className="h-9 animate-pulse rounded-full bg-surface-2" />
        <div className="h-9 animate-pulse rounded-full bg-surface-2" />
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Building2, Phone, MapPin, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { sortByDistance } from "@/lib/geo";

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

  const { data } = useQuery({
    queryKey: ["hospitals-all"],
    queryFn: async () => (await supabase.from("hospitals")
      .select("id,name,kind,phone,photo_url,lat,lng,wilayas(name_ar),baladiyas(name_ar)")).data ?? [],
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
          {visible.map((h: any) => <HospitalCard key={h.id} h={h} />)}
          {visible.length === 0 && (
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

function HospitalCard({ h }: { h: any }) {
  const km = fmtKm((h as any)._distanceKm);
  return (
    <Link to="/hospitals" className="flex items-stretch gap-3 overflow-hidden rounded-2xl bg-surface card-elevated p-3">
      {h.photo_url ? (
        <img src={h.photo_url} alt={h.name} className="h-24 w-28 flex-shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-24 w-28 flex-shrink-0 items-center justify-center rounded-xl bg-surface-2">
          <Building2 className="h-10 w-10 text-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1 text-right">
        <h3 className="truncate text-base font-extrabold">{h.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {h.wilayas?.name_ar}{h.baladiyas?.name_ar ? ` - ${h.baladiyas?.name_ar}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap justify-end gap-1.5">
          {["طوارئ","جراحة","أطفال"].map((t) => (
            <span key={t} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] text-primary">{t}</span>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1 text-[11px]">
          {km && <span className="font-bold text-primary">{km}</span>}
          <MapPin className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
      <a
        href={`tel:${h.phone}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center self-end rounded-full bg-primary/10"
      >
        <Phone className="h-4 w-4 text-primary" />
      </a>
    </Link>
  );
}

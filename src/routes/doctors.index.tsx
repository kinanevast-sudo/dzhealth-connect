import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Phone, Star, MapPin, Map as MapIcon, BadgeCheck, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { openMap } from "@/lib/map";

export const Route = createFileRoute("/doctors/")({ component: Doctors });

function Doctors() {
  const [q, setQ] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["doctors-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors")
        .select("id,full_name,rating,reviews_count,fee,phone,photo_url,verified,lat,lng,specialties(name_ar),wilayas(name_ar),baladiyas(name_ar)");
      if (error) throw error;
      return data ?? [];
    },
    retry: 1,
    staleTime: 60_000,
  });

  const filtered = (data ?? []).filter((d: any) =>
    !q || d.full_name?.toLowerCase().includes(q.toLowerCase()) ||
    d.specialties?.name_ar?.includes(q) || d.wilayas?.name_ar?.includes(q)
  );

  return (
    <AppShell>
      <ScreenHeader title="الأطباء" />
      <div className="px-4 pt-3 pb-6">
        <div className="flex items-center gap-2 rounded-2xl bg-surface card-elevated px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن طبيب أو تخصص..."
            className="w-full bg-transparent text-right text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} طبيب</span>
          <span>أطباء مميزون</span>
        </div>

        <div className="mt-3 space-y-3">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <DoctorSkeleton key={i} />)}
          {!isLoading && isError && (
            <div className="rounded-2xl bg-surface card-elevated p-8 text-center text-sm text-muted-foreground">
              <p>تعذّر تحميل الأطباء. تحقق من الاتصال بالإنترنت.</p>
              <button onClick={() => refetch()} className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">إعادة المحاولة</button>
            </div>
          )}
          {!isLoading && !isError && filtered.map((d: any) => <DoctorCard key={d.id} d={d} />)}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="rounded-2xl bg-surface card-elevated p-8 text-center text-sm text-muted-foreground">لا توجد نتائج</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function DoctorAvatar({ src, alt }: { src?: string | null; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: "#cffafe", color: "#0891b2" }}>
        <Stethoscope className="h-8 w-8" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)} className="h-20 w-20 rounded-2xl object-cover" />;
}

function DoctorCard({ d }: { d: any }) {
  return (
    <Link to="/doctors/$id" params={{ id: d.id }} className="block rounded-2xl p-4 active:scale-[0.98] transition" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <DoctorAvatar src={d.photo_url} alt={d.full_name} />
          {d.verified && (
            <div className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "#0891b2" }}>
              <BadgeCheck className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 text-right">
          <h3 className="text-base font-extrabold leading-tight">{d.full_name}</h3>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: "#0891b2" }}>{d.specialties?.name_ar}</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <span>{d.wilayas?.name_ar}{d.baladiyas?.name_ar ? ` - ${d.baladiyas?.name_ar}` : ""}</span>
            <MapPin className="h-3 w-3" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: "#0891b2" }}>{d.fee} دج</span>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">({d.reviews_count ?? 0})</span>
              <span className="font-bold">{d.rating}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <button onClick={(e) => e.preventDefault()} className="flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold text-white" style={{ background: "#0e7490" }}>
          <MapIcon className="h-4 w-4" /> عرض على الخريطة
        </button>
        <a href={`tel:${d.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold" style={{ background: "#e0f2fe", color: "#0891b2" }}>
          <Phone className="h-4 w-4" /> اتصال
        </a>
      </div>
    </Link>
  );
}

function DoctorSkeleton() {
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

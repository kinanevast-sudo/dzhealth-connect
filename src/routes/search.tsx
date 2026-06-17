import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, ChevronUp, MapPin, Mic, Stethoscope, Star, Phone, BadgeCheck, Map as MapIcon, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { openMap } from "@/lib/map";
import { sortByDistance } from "@/lib/geo";

export const Route = createFileRoute("/search")({ component: Page });

const TYPES = [
  { id: "all", label: "الكل", icon: null, color: "#0891b2", bg: "#e0f2fe" },
  { id: "doctors", label: "الأطباء", icon: "👨‍⚕️", color: "#0891b2", bg: "#0891b2" },
  { id: "hospitals", label: "المستشفيات", icon: "🏥", color: "#3b82f6", bg: "#dbeafe" },
  { id: "pharmacies", label: "الصيدليات", icon: "💊", color: "#10b981", bg: "#d1fae5" },
  { id: "donors", label: "متبرعو الدم", icon: "🩸", color: "#ef4444", bg: "#fee2e2" },
  { id: "labs", label: "مخابر التحاليل", icon: "🧪", color: "#7c3aed", bg: "#ede9fe" },
  { id: "charities", label: "الجمعيات الخيرية", icon: "🤝", color: "#f59e0b", bg: "#fef3c7" },
  { id: "ambulances", label: "سيارات الإسعاف", icon: "🚑", color: "#dc2626", bg: "#fee2e2" },
];

const SUB = [
  { id: "all", label: "الكل" },
  { id: "peds", label: "طب الأطفال", icon: "👶" },
  { id: "hosp", label: "المستشفيات", icon: "🏥" },
  { id: "pharma", label: "الصيدليات", icon: "💊" },
];

function Page() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("doctors");
  const [sub, setSub] = useState("all");
  const [wOpen, setWOpen] = useState(false);
  const [tOpen, setTOpen] = useState(false);
  const [wilaya, setWilaya] = useState<{ id: number; name_ar: string } | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [sortNearest, setSortNearest] = useState(false);

  useEffect(() => {
    if (!sortNearest || origin || typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setSortNearest(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [sortNearest, origin]);

  const { data: wilayas = [] } = useQuery({
    queryKey: ["wilayas"],
    queryFn: async () => (await supabase.from("wilayas").select("id,name_ar").order("id")).data ?? [],
  });

  const table =
    type === "hospitals" ? "hospitals" :
    type === "pharmacies" ? "pharmacies" :
    type === "donors" ? "blood_donors" :
    type === "labs" ? "labs" :
    type === "charities" ? "charities" :
    type === "ambulances" ? "ambulances" :
    "doctors";
  const nameCol = table === "doctors" || table === "blood_donors" ? "full_name" : "name";

  const selectCols = table === "doctors"
    ? "id,full_name,photo_url,rating,reviews_count,fee,phone,verified,lat,lng,specialties(name_ar),wilayas(name_ar),baladiyas(name_ar)"
    : table === "blood_donors"
      ? `id,${nameCol},photo_url,phone,wilayas(name_ar),baladiyas(name_ar)`
      : `id,${nameCol},photo_url,phone,lat,lng,verified,wilayas(name_ar),baladiyas(name_ar)`;

  const { data: rawResults = [] } = useQuery({
    queryKey: ["search", table, q, wilaya?.id],
    queryFn: async () => {
      let query: any = (supabase.from as any)(table).select(selectCols).limit(30);
      if (q) query = query.ilike(nameCol, `%${q}%`);
      if (wilaya?.id) query = query.eq("wilaya_id", wilaya.id);
      const { data } = await query;
      return data ?? [];
    },
  });

  const results = sortNearest && origin ? sortByDistance(rawResults as any, origin) : rawResults;

  const detailBase = table === "doctors" ? "/doctors" : table === "hospitals" ? "/hospitals" : table === "pharmacies" ? "/pharmacies" : table === "blood_donors" ? "/donors" : "";

  return (
    <AppShell>
      <div dir="rtl" className="min-h-[100dvh]" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <header className="px-5 pt-8 pb-3">
          <h1 className="text-2xl font-extrabold text-right">بحث</h1>

          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1 flex items-center rounded-2xl px-3 py-3" style={{ background: "#e0f2fe" }}>
              <SearchIcon className="h-4 w-4 shrink-0" style={{ color: "#64748b" }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن طبيب، تخصص، و..."
                className="flex-1 bg-transparent px-2 text-sm outline-none text-right placeholder:text-slate-500"
              />
              <button aria-label="إدخال صوتي" className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "#bae6fd" }}>
                <Mic className="h-3.5 w-3.5" style={{ color: "#0891b2" }} />
              </button>
            </div>
            <button
              onClick={() => setWOpen((v) => !v)}
              className="shrink-0 flex items-center gap-1.5 rounded-2xl px-3 py-3"
              style={{ background: "#e0f2fe" }}
            >
              <ChevronUp className={`h-4 w-4 transition-transform ${wOpen ? "" : "rotate-180"}`} style={{ color: "#0891b2" }} />
              <span className="text-sm font-semibold">{wilaya?.name_ar ?? "الولاية"}</span>
              <MapPin className="h-4 w-4" style={{ color: "#0891b2" }} />
            </button>
          </div>

          {wOpen && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl p-2 shadow-lg" style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
              <button
                onClick={() => { setWilaya(null); setWOpen(false); }}
                className="block w-full rounded-xl px-3 py-2 text-right text-sm hover:bg-muted"
              >
                كل الولايات
              </button>
              {wilayas.map((w: any) => (
                <button
                  key={w.id}
                  onClick={() => { setWilaya(w); setWOpen(false); }}
                  className={`block w-full rounded-xl px-3 py-2 text-right text-sm hover:bg-muted ${wilaya?.id === w.id ? "font-bold" : ""}`}
                  style={wilaya?.id === w.id ? { background: "#e0f2fe", color: "#0891b2" } : undefined}
                >
                  {w.name_ar}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3">
            <button
              onClick={() => setTOpen((v) => !v)}
              className="flex w-full items-center gap-2 rounded-2xl px-3 py-3"
              style={{ background: "#e0f2fe" }}
            >
              <ChevronUp className={`h-4 w-4 transition-transform ${tOpen ? "" : "rotate-180"}`} style={{ color: "#0891b2" }} />
              <span className="flex-1 text-right text-sm font-semibold">{SUB.find(s => s.id === sub)?.label ?? "الكل"}</span>
              <Stethoscope className="h-4 w-4 shrink-0" style={{ color: "#0891b2" }} />
            </button>
            {tOpen && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl p-2 shadow-lg" style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                {SUB.map((s) => (
                  <button key={s.id} onClick={() => { setSub(s.id); setTOpen(false); }}
                    className={`flex w-full items-center justify-end gap-2 rounded-xl px-3 py-2 text-right text-sm hover:bg-muted ${sub === s.id ? "font-bold" : ""}`}
                    style={sub === s.id ? { background: "#e0f2fe", color: "#0891b2" } : undefined}>
                    <span>{s.label}</span>{s.icon && <span>{s.icon}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div dir="rtl" className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {TYPES.map((t) => {
              const active = type === t.id;
              return (
                <button key={t.id} onClick={() => setType(t.id)}
                  className="shrink-0 flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold"
                  style={active
                    ? { background: t.color, color: "white" }
                    : { background: t.bg, color: t.color }}>
                  <span>{t.label}</span>
                  {t.icon && <span>{t.icon}</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setSortNearest((v) => !v)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
              style={sortNearest ? { background: "#0891b2", color: "white" } : { background: "#e0f2fe", color: "#0891b2" }}
            >
              <Navigation className="h-3.5 w-3.5" />
              {sortNearest ? "مُرتّب حسب الأقرب" : "ترتيب حسب الأقرب"}
            </button>
          </div>
        </header>

        <section className="px-5 pb-24 space-y-3">
          {results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد نتائج</p>
          )}
          {results.map((r: any) => {
            const href = table === "doctors" ? `/doctors/${r.id}` : `${detailBase}/${r.id}`;
            const name = r[nameCol];
            const loc = `${r.wilayas?.name_ar ?? ""}${r.baladiyas?.name_ar ? ` - ${r.baladiyas.name_ar}` : ""}`;
            const dist = r._distanceKm;
            return (
              <div key={r.id} className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <a href={href} className="block">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0 order-2">
                      {r.photo_url ? (
                        <img src={r.photo_url} alt={name} className="h-20 w-20 rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: "#cffafe", color: "#0891b2" }}>
                          <Stethoscope className="h-8 w-8" />
                        </div>
                      )}
                      {r.verified && (
                        <div className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "#0891b2" }}>
                          <BadgeCheck className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                      <h3 className="text-base font-extrabold leading-tight">{name}</h3>
                      {r.specialties?.name_ar && (
                        <p className="mt-0.5 text-sm font-semibold" style={{ color: "#0891b2" }}>{r.specialties.name_ar}</p>
                      )}
                      {loc && (
                        <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <span>{loc}</span>
                          <MapPin className="h-3 w-3" />
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        {dist != null && isFinite(dist) ? (
                          <span className="text-xs font-bold" style={{ color: "#0891b2" }}>
                            {dist < 1 ? `${Math.round(dist * 1000)} م` : `${dist.toFixed(1)} كم`}
                          </span>
                        ) : r.fee != null ? (
                          <span className="text-xs font-bold" style={{ color: "#0891b2" }}>{r.fee} دج</span>
                        ) : <span />}
                        {r.rating != null && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">({r.reviews_count ?? 0})</span>
                            <span className="font-bold">{r.rating}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
                <div className="mt-3 grid grid-cols-2 gap-2.5 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openMap(r.lat, r.lng, `${name} ${loc}`.trim()); }}
                    className="flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold text-white"
                    style={{ background: "#0891b2" }}
                  >
                    <MapIcon className="h-4 w-4" /> موقع على الخريطة
                  </button>
                  <a href={r.phone ? `tel:${r.phone}` : "#"} onClick={(e) => { if (!r.phone) e.preventDefault(); }} className="flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold" style={{ background: "#e0f2fe", color: "#0891b2" }}>
                    <Phone className="h-4 w-4" /> اتصال
                  </a>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}

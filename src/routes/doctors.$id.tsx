import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Phone, MapPin, Share2, Heart, BadgeCheck, Map as MapIcon, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/doctors/$id")({ component: Detail });

const TABS = ["نبذة عن الطبيب", "التقييمات", "احجز موعد"] as const;

function Detail() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<(typeof TABS)[number]>("نبذة عن الطبيب");

  const { data: d } = useQuery({
    queryKey: ["doctor", id],
    queryFn: async () => {
      const { data } = await supabase.from("doctors")
        .select("*,specialties(name_ar),wilayas(name_ar),baladiyas(name_ar)")
        .eq("id", id).maybeSingle();
      return data;
    },
  });

  if (!d) return <div className="min-h-[100dvh] bg-background p-8 text-center text-muted-foreground">جارٍ التحميل...</div>;
  const x = d as any;

  return (
    <div className="dark min-h-[100dvh] pb-32" style={{ background: "#0a1628", color: "#e2f7ff" }}>
      {/* Hero photo */}
      <div className="relative h-[420px] overflow-hidden">
        {x.photo_url ? (
          <img src={x.photo_url} alt={x.full_name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1e3a5f, #0a1628)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,22,40,0.4) 0%, rgba(10,22,40,0.1) 50%, #0a1628 100%)" }} />

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-6">
          <Link to="/doctors" className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
            <ArrowLeft className="h-5 w-5 text-white rotate-180" />
          </Link>
          <div className="flex gap-2">
            <button className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
              <Share2 className="h-5 w-5 text-white" />
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
              <Heart className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Name overlay */}
        <div className="absolute inset-x-0 bottom-4 z-10 px-5 text-right">
          <div className="flex items-center justify-end gap-2">
            <h1 className="text-2xl font-extrabold text-white">{x.full_name}</h1>
            {x.verified && <BadgeCheck className="h-6 w-6" style={{ color: "#22d3ee", fill: "#0891b2" }} />}
          </div>
          <p className="mt-1 text-base font-semibold" style={{ color: "#22d3ee" }}>{x.specialties?.name_ar}</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-sm" style={{ color: "#94d3e3" }}>
            <span>{x.wilayas?.name_ar} - {x.baladiyas?.name_ar}</span>
            <MapPin className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl p-4" style={{ background: "rgba(15, 30, 50, 0.6)", border: "1px solid rgba(34, 211, 238, 0.2)" }}>
          <Stat label="الخبرة" value={`${x.experience_years ?? 12}`} suffix="سنوات" />
          <Stat label="المرضى" value={`+${((x.patients_count ?? 2800)/1000).toFixed(1)}K`} />
          <Stat label="نسبة الرضا" value={`${x.satisfaction ?? 98}%`} />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a href={`tel:${x.phone}`} className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold" style={{ background: "rgba(15, 30, 50, 0.8)", border: "1px solid rgba(34, 211, 238, 0.3)", color: "#e2f7ff" }}>
            <Phone className="h-4 w-4" /> اتصال
          </a>
          <button className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold" style={{ background: "#22d3ee", color: "#0a1628", boxShadow: "0 0 24px rgba(34, 211, 238, 0.5)" }}>
            <MapIcon className="h-4 w-4" /> عرض على الخريطة
          </button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl p-1" style={{ background: "rgba(15, 30, 50, 0.6)", border: "1px solid rgba(34, 211, 238, 0.2)" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 rounded-xl py-2.5 text-xs font-bold transition"
              style={tab === t
                ? { background: "#22d3ee", color: "#0a1628", boxShadow: "0 0 16px rgba(34, 211, 238, 0.5)" }
                : { color: "#94d3e3" }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "نبذة عن الطبيب" && (
          <>
            <Panel title="نبذة عن الطبيب">
              <p className="text-sm leading-relaxed" style={{ color: "#b8dde9" }}>{x.about ?? "أستاذ محاضر، متخصص في تشخيص وعلاج الأمراض ضمن مجال التخصص."}</p>
            </Panel>
            <Panel title="التخصص">
              <div className="flex flex-wrap justify-end gap-2">
                {[x.specialties?.name_ar, "أمراض مزمنة", "كشف عام"].filter(Boolean).map((s: string) => (
                  <span key={s} className="rounded-xl px-3 py-1.5 text-xs font-semibold" style={{ border: "1px solid rgba(34, 211, 238, 0.4)", color: "#22d3ee" }}>{s}</span>
                ))}
              </div>
            </Panel>
          </>
        )}

        {tab === "التقييمات" && (
          <Panel title="التقييمات">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-extrabold" style={{ color: "#22d3ee" }}>{x.rating}</span>
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="mt-1 text-center text-xs" style={{ color: "#94d3e3" }}>{x.reviews_count} تقييم</p>
          </Panel>
        )}

        {tab === "احجز موعد" && (
          <Panel title="احجز موعدك">
            <p className="text-center text-xs" style={{ color: "#94d3e3" }}>قريباً — اختر اليوم والساعة المناسبة.</p>
          </Panel>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 p-4" style={{ background: "rgba(10, 22, 40, 0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(34, 211, 238, 0.2)" }}>
        <div className="flex items-center justify-between gap-3">
          <button className="flex-1 rounded-2xl py-3.5 text-sm font-extrabold" style={{ background: "#22d3ee", color: "#0a1628", boxShadow: "0 0 24px rgba(34, 211, 238, 0.6)" }}>احجز موعد</button>
          <div className="text-right">
            <p className="text-[10px]" style={{ color: "#94d3e3" }}>رسوم الاستشارة</p>
            <p className="text-lg font-extrabold" style={{ color: "#22d3ee" }}>{x.fee} دج</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-extrabold" style={{ color: "#22d3ee", textShadow: "0 0 12px rgba(34, 211, 238, 0.6)" }}>
        {value} {suffix && <span className="text-xs font-semibold" style={{ color: "#94d3e3" }}>{suffix}</span>}
      </p>
      <p className="mt-1 text-[11px]" style={{ color: "#94d3e3" }}>{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 text-right" style={{ background: "rgba(15, 30, 50, 0.6)", border: "1px solid rgba(34, 211, 238, 0.2)" }}>
      <h3 className="mb-3 text-sm font-bold" style={{ color: "#22d3ee" }}>{title}</h3>
      {children}
    </div>
  );
}

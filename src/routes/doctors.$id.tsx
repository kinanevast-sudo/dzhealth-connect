import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Phone, MapPin, Share2, Heart, BadgeCheck, Map as MapIcon, Star, Stethoscope, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { openMap } from "@/lib/map";

export const Route = createFileRoute("/doctors/$id")({ component: Detail });

const TABS = ["نبذة عن الطبيب", "التقييمات", "احجز موعد"] as const;

function detectGender(x: any): "male" | "female" {
  const g = (x?.gender || "").toString().toLowerCase();
  if (["f", "female", "أنثى", "انثى", "femme"].includes(g)) return "female";
  if (["m", "male", "ذكر", "homme"].includes(g)) return "male";
  const name = (x?.full_name || "").toString();
  if (/^د[\.ـ\s]*ة|دكتورة|الدكتورة|آنسة|سيدة/.test(name)) return "female";
  // Arabic female-name endings
  if (/(ة|ى|اء)\s*$/.test(name.replace(/^د\.?\s*|دكتور(ة)?\s*/g, ""))) return "female";
  return "male";
}

function PlaceholderAvatar({ gender }: { gender: "male" | "female" }) {
  const bg = gender === "female"
    ? "linear-gradient(135deg, #fce7f3, #fbcfe8)"
    : "linear-gradient(135deg, #cffafe, #a5f3fc)";
  const color = gender === "female" ? "#be185d" : "#0e7490";
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: bg }}>
      <svg viewBox="0 0 200 200" className="h-40 w-40" fill="none">
        <circle cx="100" cy="74" r="38" fill={color} opacity="0.85" />
        <path d="M30 190c0-38 32-66 70-66s70 28 70 66" fill={color} opacity="0.85" />
        {gender === "female" && (
          <path d="M62 60c0-22 17-40 38-40s38 18 38 40c0 6-2 12-5 16-4-10-14-18-33-18s-29 8-33 18c-3-4-5-10-5-16z" fill={color} />
        )}
      </svg>
    </div>
  );
}

function Detail() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<(typeof TABS)[number]>("نبذة عن الطبيب");
  const [imgError, setImgError] = useState(false);
  const [fav, setFav] = useState(false);
  const [added, setAdded] = useState(false);

  const { data: d, isLoading, isError } = useQuery({
    queryKey: ["doctor", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors")
        .select("*,specialties(name_ar),wilayas(name_ar),baladiyas(name_ar)")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    retry: 1,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (id) setFav(localStorage.getItem(`fav-doctor-${id}`) === "1");
  }, [id]);

  if (isLoading) return <DoctorSkeleton />;
  if (isError || !d) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 p-8 text-center" style={{ background: "#f8fafc", color: "#0f172a" }}>
        <Stethoscope className="h-12 w-12" style={{ color: "#0891b2" }} />
        <p className="text-sm text-muted-foreground">تعذّر تحميل بيانات الطبيب. تحقق من الاتصال بالإنترنت.</p>
        <Link to="/doctors" className="rounded-2xl px-5 py-2.5 text-sm font-bold" style={{ background: "#0891b2", color: "white" }}>رجوع</Link>
      </div>
    );
  }
  const x = d as any;
  const showImg = x.photo_url && !imgError;
  const gender = detectGender(x);

  const toggleFav = () => {
    const v = !fav;
    setFav(v);
    localStorage.setItem(`fav-doctor-${id}`, v ? "1" : "0");
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const data = { title: x.full_name, text: `${x.full_name} — ${x.specialties?.name_ar ?? ""}`, url };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard?.writeText(url); alert("تم نسخ الرابط"); }
    } catch {}
  };

  const addToList = () => {
    const key = "my-doctors";
    const list: string[] = JSON.parse(localStorage.getItem(key) || "[]");
    if (!list.includes(id)) { list.push(id); localStorage.setItem(key, JSON.stringify(list)); }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div dir="rtl" className="min-h-[100dvh] pb-32" style={{ background: "#f8fafc", color: "#0f172a" }}>
      {/* Hero photo */}
      <div className="relative h-[420px] overflow-hidden">
        {showImg ? (
          <img src={x.photo_url} alt={x.full_name} loading="lazy" onError={() => setImgError(true)} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <PlaceholderAvatar gender={gender} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(248,250,252,0) 40%, rgba(248,250,252,0.85) 85%, #f8fafc 100%)" }} />

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-6" dir="ltr">
          <div className="flex gap-2">
            <button onClick={toggleFav} aria-label="مفضلة" className="flex h-11 w-11 items-center justify-center rounded-full shadow-md" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)" }}>
              <Heart className="h-5 w-5" style={{ color: fav ? "#e11d48" : "#0f172a", fill: fav ? "#e11d48" : "transparent" }} />
            </button>
            <button onClick={share} aria-label="مشاركة" className="flex h-11 w-11 items-center justify-center rounded-full shadow-md" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)" }}>
              <Share2 className="h-5 w-5" style={{ color: "#0f172a" }} />
            </button>
            <button onClick={addToList} aria-label="إضافة" className="flex h-11 w-11 items-center justify-center rounded-full shadow-md" style={{ background: added ? "#10b981" : "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)" }}>
              {added ? <Check className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5" style={{ color: "#0f172a" }} />}
            </button>
          </div>
          <Link to="/doctors" aria-label="رجوع" className="flex h-11 w-11 items-center justify-center rounded-full shadow-md" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)" }}>
            <ArrowLeft className="h-5 w-5" style={{ color: "#0f172a" }} />
          </Link>
        </div>

        {/* Name overlay */}
        <div className="absolute inset-x-0 bottom-4 z-10 px-5 text-right">
          <div className="flex items-center justify-end gap-2">
            <h1 className="text-2xl font-extrabold" style={{ color: "#0f172a" }}>{x.full_name}</h1>
            {x.verified && <BadgeCheck className="h-6 w-6" style={{ color: "white", fill: "#0891b2" }} />}
          </div>
          <p className="mt-1 text-base font-semibold" style={{ color: "#0891b2" }}>{x.specialties?.name_ar}</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-sm text-muted-foreground">
            <span>{x.wilayas?.name_ar} - {x.baladiyas?.name_ar}</span>
            <MapPin className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4">
        <div className="grid grid-cols-3 gap-3 rounded-2xl p-4" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(15,23,42,0.04)" }}>
          <Stat label="نسبة الرضا" value={`${x.satisfaction ?? 98}%`} />
          <Stat label="المرضى" value={`+${((x.patients_count ?? 2800)/1000).toFixed(1)}K`} />
          <Stat label="الخبرة" value={`${x.experience_years ?? 12}`} suffix="سنوات" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => openMap(x.lat, x.lng, x.full_name)} className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold" style={{ background: "#0891b2", color: "white", boxShadow: "0 8px 20px rgba(8,145,178,0.3)" }}>
            <MapIcon className="h-4 w-4" /> عرض على الخريطة
          </button>
          <a href={`tel:${x.phone}`} className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold" style={{ background: "white", border: "1px solid #e2e8f0", color: "#0f172a" }}>
            <Phone className="h-4 w-4" /> اتصال
          </a>
        </div>

        <div className="flex rounded-2xl p-1" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className="flex-1 rounded-xl py-2.5 text-xs font-bold transition"
              style={tab === t ? { background: "#0891b2", color: "white" } : { color: "#64748b" }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "نبذة عن الطبيب" && (
          <>
            <Panel title="نبذة عن الطبيب">
              <p className="text-sm leading-relaxed text-muted-foreground">{x.about ?? "أستاذ محاضر، متخصص في تشخيص وعلاج الأمراض ضمن مجال التخصص."}</p>
            </Panel>
            <Panel title="التخصص">
              <div className="flex flex-wrap justify-end gap-2">
                {[x.specialties?.name_ar, "أمراض مزمنة", "كشف عام"].filter(Boolean).map((s: string) => (
                  <span key={s} className="rounded-xl px-3 py-1.5 text-xs font-semibold" style={{ background: "#ecfeff", color: "#0891b2" }}>{s}</span>
                ))}
              </div>
            </Panel>
          </>
        )}

        {tab === "التقييمات" && (
          <Panel title="التقييمات">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-extrabold" style={{ color: "#0891b2" }}>{x.rating}</span>
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="mt-1 text-center text-xs text-muted-foreground">{x.reviews_count} تقييم</p>
          </Panel>
        )}

        {tab === "احجز موعد" && (
          <Panel title="احجز موعدك">
            <p className="text-center text-xs text-muted-foreground">قريباً — اختر اليوم والساعة المناسبة.</p>
          </Panel>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 p-4" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between gap-3">
          <button className="flex-1 rounded-2xl py-3.5 text-sm font-extrabold" style={{ background: "#0891b2", color: "white", boxShadow: "0 8px 20px rgba(8,145,178,0.3)" }}>احجز موعد</button>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">رسوم الاستشارة</p>
            <p className="text-lg font-extrabold" style={{ color: "#0891b2" }}>{x.fee} دج</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-extrabold" style={{ color: "#0891b2" }}>
        {value} {suffix && <span className="text-xs font-semibold text-muted-foreground">{suffix}</span>}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 text-right" style={{ background: "white", border: "1px solid #e2e8f0" }}>
      <h3 className="mb-3 text-sm font-bold" style={{ color: "#0891b2" }}>{title}</h3>
      {children}
    </div>
  );
}

function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

function DoctorSkeleton() {
  return (
    <div className="min-h-[100dvh] pb-32" style={{ background: "#f8fafc" }}>
      <Shimmer className="h-[420px] !rounded-none" />
      <div className="px-4 -mt-12 space-y-4">
        <Shimmer className="h-24" />
        <div className="grid grid-cols-2 gap-3">
          <Shimmer className="h-12" />
          <Shimmer className="h-12" />
        </div>
        <Shimmer className="h-12" />
        <Shimmer className="h-28" />
        <Shimmer className="h-20" />
      </div>
    </div>
  );
}

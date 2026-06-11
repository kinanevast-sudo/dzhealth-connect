import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search, MapPin, Phone, Stethoscope, Building2, Pill, Droplet, Accessibility, Leaf, Eye, Baby, Brain, Bone, Heart, Star, ChevronLeft, BadgeCheck, Map as MapIcon, Zap } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/home")({ component: Home });

const specialties = [
  { icon: Droplet, label: "متبرعو الدم", to: "/donors", color: "#ef4444", bg: "#fee2e2" },
  { icon: Pill, label: "الصيدليات", to: "/pharmacies", color: "#10b981", bg: "#d1fae5" },
  { icon: Building2, label: "المستشفيات", to: "/hospitals", color: "#3b82f6", bg: "#dbeafe" },
  { icon: Baby, label: "طب الأطفال", to: "/doctors", color: "#f59e0b", bg: "#fef3c7" },
  { icon: Accessibility, label: "المعدات الطبية", to: "/equipment", color: "#0891b2", bg: "#cffafe" },
  { icon: Leaf, label: "الطب البديل", to: "/search", color: "#22c55e", bg: "#dcfce7" },
  { icon: Eye, label: "طب العيون", to: "/doctors", color: "#8b5cf6", bg: "#ede9fe" },
  { icon: Stethoscope, label: "طب الأسنان", to: "/doctors", color: "#06b6d4", bg: "#cffafe" },
  { icon: Brain, label: "طب الأعصاب", to: "/doctors", color: "#ec4899", bg: "#fce7f3" },
  { icon: Bone, label: "العظام والمفاصل", to: "/doctors", color: "#f97316", bg: "#ffedd5" },
  { icon: Heart, label: "أمراض النساء", to: "/doctors", color: "#e11d48", bg: "#ffe4e6" },
  { icon: Heart, label: "القلب والشرايين", to: "/doctors", color: "#dc2626", bg: "#fee2e2" },
];

function Home() {
  const [showAll, setShowAll] = useState(false);

  const { data: doctors } = useQuery({
    queryKey: ["featured-doctors"],
    queryFn: async () => {
      const { data } = await supabase.from("doctors")
        .select("id,full_name,rating,reviews_count,photo_url,fee,verified,specialties(name_ar),wilayas(name_ar),baladiyas(name_ar)")
        .order("rating", { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  const { data: hospitals } = useQuery({
    queryKey: ["nearby-hospitals"],
    queryFn: async () => {
      const { data } = await supabase.from("hospitals")
        .select("id,name,photo_url,wilayas(name_ar),baladiyas(name_ar)").limit(4);
      return data ?? [];
    },
  });

  const { data: pharmacies } = useQuery({
    queryKey: ["nearby-pharmacies"],
    queryFn: async () => {
      const { data } = await supabase.from("pharmacies")
        .select("id,name,is_24_7,phone,wilayas(name_ar)").limit(4);
      return data ?? [];
    },
  });

  const { data: emergency } = useQuery({
    queryKey: ["emergency-donor"],
    queryFn: async () => {
      const { data } = await supabase.from("blood_donors").select("*,wilayas(name_ar),baladiyas(name_ar)").eq("emergency", true).limit(1).maybeSingle();
      return data;
    },
  });

  const visibleSpecs = showAll ? specialties : specialties.slice(0, 8);

  return (
    <AppShell>
      <div className="light min-h-[100dvh]" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        {/* Header */}
        <header className="px-5 pt-8 pb-4">
          <div className="flex items-start justify-between">
            <Link to="/notifications" className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "#e0f2fe" }}>
              <Bell className="h-5 w-5" style={{ color: "#0891b2" }} />
            </Link>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">مرحباً 👋</p>
              <h1 className="text-xl font-extrabold leading-tight">كيف يمكننا مساعدتك اليوم؟</h1>
              <div className="mt-1 flex items-center justify-end gap-1 text-[12px] text-muted-foreground">
                <span>الحجار، عنابة</span><MapPin className="h-3 w-3" />
              </div>
            </div>
          </div>

          <Link to="/search" className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-3.5 text-sm text-muted-foreground" style={{ background: "#f0f9ff" }}>
            <Search className="h-4 w-4" />
            ابحث عن طبيب، تخصص، ولاية...
          </Link>
        </header>

        {/* Stats */}
        <section className="px-5">
          <div className="grid grid-cols-4 gap-3">
            <StatCard icon={Droplet} value="+800" label="متبرعو الدم" color="#ef4444" bg="#fee2e2" />
            <StatCard icon={Pill} value="+4,500" label="الصيدليات" color="#10b981" bg="#d1fae5" />
            <StatCard icon={Building2} value="+320" label="المستشفيات" color="#3b82f6" bg="#dbeafe" />
            <StatCard icon={Stethoscope} value="+1,240" label="الأطباء" color="#0891b2" bg="#cffafe" />
          </div>
        </section>

        {/* Specialties */}
        <section className="mt-6 px-5">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => setShowAll((s) => !s)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#0891b2" }}>
              {showAll ? "عرض أقل" : "عرض الكل"} <ChevronLeft className={`h-3 w-3 transition-transform ${showAll ? "rotate-90" : "-rotate-90"}`} />
            </button>
            <h2 className="text-base font-bold">التخصصات</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {visibleSpecs.map((s) => (
              <Link key={s.label} to={s.to} className="flex flex-col items-center gap-2 rounded-2xl p-3 active:scale-95 transition" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: s.bg }}>
                  <s.icon className="h-6 w-6" style={{ color: s.color }} />
                </div>
                <span className="text-[10px] font-semibold leading-tight text-center">{s.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Emergency banner */}
        <section className="mt-6 px-5">
          <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #fecaca, #fee2e2)" }}>
            <div className="flex items-center justify-between">
              <button className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-md" style={{ background: "#ef4444", color: "white" }}>
                <Phone className="h-5 w-5" />
              </button>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-bold" style={{ color: "#dc2626" }}>مطلوب بشكل عاجل</span>
                  <Zap className="h-4 w-4" style={{ color: "#dc2626" }} />
                </div>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "#fecaca", color: "#991b1b" }}>حالة طارئة</span>
                  <span className="text-lg font-extrabold" style={{ color: "#dc2626" }}>{(emergency as any)?.blood_type ?? "O+"}</span>
                </div>
                {emergency && (
                  <p className="mt-1 text-[11px] text-muted-foreground">{(emergency as any).full_name} — {(emergency as any).wilayas?.name_ar}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Featured doctors */}
        <section className="mt-6 px-5">
          <div className="mb-3 flex items-center justify-between">
            <Link to="/doctors" className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#0891b2" }}>عرض الكل <ChevronLeft className="h-3 w-3" /></Link>
            <h2 className="text-base font-bold">أطباء مميزون</h2>
          </div>
          <div className="space-y-3">
            {(doctors ?? []).map((d: any) => <DoctorCard key={d.id} d={d} />)}
          </div>
        </section>

        {/* Nearby hospitals */}
        <section className="mt-6 px-5">
          <div className="mb-3 flex items-center justify-between">
            <Link to="/hospitals" className="text-xs font-semibold" style={{ color: "#0891b2" }}>عرض الكل</Link>
            <h2 className="text-base font-bold">مستشفيات قريبة</h2>
          </div>
          <div className="space-y-3">
            {(hospitals ?? []).map((h: any) => <HospitalCard key={h.id} h={h} />)}
          </div>
        </section>

        {/* Nearby pharmacies */}
        <section className="mt-6 px-5">
          <div className="mb-3 flex items-center justify-between">
            <Link to="/pharmacies" className="text-xs font-semibold" style={{ color: "#0891b2" }}>عرض الكل</Link>
            <h2 className="text-base font-bold">صيدليات قريبة</h2>
          </div>
          <div className="space-y-3">
            {(pharmacies ?? []).map((p: any) => <PharmacyCard key={p.id} p={p} />)}
          </div>
        </section>

        <div className="h-8" />
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, value, label, color, bg }: any) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: bg }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="text-sm font-extrabold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function DoctorCard({ d }: { d: any }) {
  return (
    <Link to="/doctors/$id" params={{ id: d.id }} className="block rounded-2xl p-4 active:scale-[0.98] transition" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {d.photo_url ? (
            <img src={d.photo_url} alt={d.full_name} className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold" style={{ background: "#cffafe", color: "#0891b2" }}>د</div>
          )}
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
            <span>{d.wilayas?.name_ar} - {d.baladiyas?.name_ar}</span>
            <MapPin className="h-3 w-3" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: "#0891b2" }}>{d.fee} دج</span>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">({d.reviews_count})</span>
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

function HospitalCard({ h }: { h: any }) {
  return (
    <div className="flex items-stretch gap-3 overflow-hidden rounded-2xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      {h.photo_url && <img src={h.photo_url} alt={h.name} className="h-24 w-28 flex-shrink-0 rounded-xl object-cover" />}
      <div className="min-w-0 flex-1 text-right">
        <h3 className="text-base font-extrabold">{h.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{h.wilayas?.name_ar} - {h.baladiyas?.name_ar}</p>
        <div className="mt-2 flex flex-wrap justify-end gap-1.5">
          {["طوارئ","جراحة","أطفال"].map((t) => (
            <span key={t} className="rounded-full px-2.5 py-0.5 text-[10px]" style={{ background: "#cffafe", color: "#0891b2" }}>{t}</span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">{h.wilayas?.name_ar}</p>
      </div>
      <button className="flex h-10 w-10 flex-shrink-0 items-center justify-center self-end rounded-full" style={{ background: "#e0f2fe" }}>
        <Phone className="h-4 w-4" style={{ color: "#0891b2" }} />
      </button>
    </div>
  );
}

function PharmacyCard({ p }: { p: any }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <a href={`tel:${p.phone}`} className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#e0f2fe" }}>
        <Phone className="h-5 w-5" style={{ color: "#0891b2" }} />
      </a>
      <div className="min-w-0 flex-1 text-right">
        <div className="flex items-center justify-end gap-2">
          {p.is_24_7 && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#dcfce7", color: "#16a34a" }}>24/7</span>}
          <h3 className="text-base font-extrabold">{p.name}</h3>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{p.wilayas?.name_ar}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: "#fef3c7" }}>💊</div>
    </div>
  );
}

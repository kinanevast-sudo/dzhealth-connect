import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MapPin, Shield, Flame, Truck, HeartPulse, Waves, Search, Map as MapIcon } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { openMap } from "@/lib/map";
import civilProtectionLogo from "@/assets/civil-protection.png.asset.json";

export const Route = createFileRoute("/civil-protection")({ component: Page });

const SECTIONS = [
  { icon: Flame, name: "إطفاء الحرائق", color: "#dc2626", bg: "#fee2e2", desc: "تدخل سريع ضد الحرائق المنزلية والصناعية والغابية" },
  { icon: HeartPulse, name: "الإسعاف الطبي", color: "#ef4444", bg: "#fecaca", desc: "نقل المرضى والمصابين وتقديم الإسعافات الأولية" },
  { icon: Truck, name: "حوادث المرور", color: "#f97316", bg: "#fed7aa", desc: "تدخل في حوادث الطرقات وإنقاذ الضحايا" },
  { icon: Waves, name: "الإنقاذ والغوص", color: "#0ea5e9", bg: "#e0f2fe", desc: "إنقاذ الغرقى والتدخل في الفيضانات والكوارث" },
  { icon: Shield, name: "الوقاية والتوعية", color: "#16a34a", bg: "#dcfce7", desc: "حملات توعية وتدريب على السلامة" },
];

type Center = { id: string; name: string; wilaya: string; phone: string; lat?: number; lng?: number };

const CENTERS: Center[] = [
  { id: "alger", name: "الوحدة الرئيسية - الجزائر العاصمة", wilaya: "الجزائر", phone: "021711414", lat: 36.7538, lng: 3.0588 },
  { id: "oran", name: "وحدة وهران", wilaya: "وهران", phone: "041390014", lat: 35.6911, lng: -0.6417 },
  { id: "constantine", name: "وحدة قسنطينة", wilaya: "قسنطينة", phone: "031920014", lat: 36.3650, lng: 6.6147 },
  { id: "annaba", name: "وحدة عنابة", wilaya: "عنابة", phone: "038860014", lat: 36.9000, lng: 7.7667 },
  { id: "setif", name: "وحدة سطيف", wilaya: "سطيف", phone: "036910014", lat: 36.1900, lng: 5.4133 },
];

function Page() {
  return (
    <AppShell>
      <ScreenHeader title="الحماية المدنية" />
      <div dir="rtl" className="px-4 pb-24 space-y-6">
        {/* Hero emergency card */}
        <div className="mt-3 rounded-3xl bg-gradient-to-br from-red-700 via-red-800 to-orange-900 border-2 border-red-600/60 p-5 shadow-[0_8px_40px_-8px_rgba(220,38,38,0.55)]">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-1.5 shrink-0">
              <img src={civilProtectionLogo.url} alt="الحماية المدنية" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-black text-lg leading-tight">الحماية المدنية الجزائرية</h2>
              <p className="text-red-100 text-xs mt-1">في حالة الطوارئ — اتصل فوراً بالرقم الأخضر</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <a href="tel:14" className="flex items-center justify-center gap-2 rounded-2xl bg-white text-red-700 py-3 font-black active:scale-95 transition">
              <Phone className="w-5 h-5" /> اتصل 14
            </a>
            <a href="tel:1021" className="flex items-center justify-center gap-2 rounded-2xl bg-red-900/70 border border-red-300/40 text-white py-3 font-black active:scale-95 transition">
              <Phone className="w-5 h-5" /> اتصل 1021
            </a>
          </div>
        </div>

        {/* Sections */}
        <section>
          <h3 className="font-black text-base mb-3 text-foreground">الأقسام والخدمات</h3>
          <div className="grid grid-cols-2 gap-3">
            {SECTIONS.map((s) => (
              <div key={s.name} className="rounded-2xl p-3 bg-card border border-border">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <h4 className="mt-2 font-bold text-sm text-foreground">{s.name}</h4>
                <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Centers */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-base text-foreground">مراكز قريبة</h3>
            <Link to="/search" className="text-primary text-xs font-medium flex items-center gap-1">
              <Search className="w-3 h-3" /> بحث
            </Link>
          </div>
          <div className="space-y-2.5">
            {CENTERS.map((c) => (
              <div key={c.id} className="rounded-2xl bg-card border border-border p-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-foreground leading-tight">{c.name}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {c.wilaya}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openMap(c.lat, c.lng, c.name)}
                    className="flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold bg-primary/10 text-primary active:scale-95 transition"
                  >
                    <MapIcon className="w-3.5 h-3.5" /> موقع على الخريطة
                  </button>
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold bg-red-600 text-white active:scale-95 transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> اتصال
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

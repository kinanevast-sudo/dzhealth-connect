import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MapPin, Shield, Flame, Truck, HeartPulse, Waves, Search, Map as MapIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { openMap } from "@/lib/map";
import civilProtectionLogo from "@/assets/civil-protection.png.asset.json";

export const Route = createFileRoute("/civil-protection")({ component: Page });

const SECTIONS_DATA = [
  { icon: Flame,     key: "fire",       color: "#dc2626", bg: "#fee2e2" },
  { icon: HeartPulse,key: "medical",    color: "#ef4444", bg: "#fecaca" },
  { icon: Truck,     key: "traffic",    color: "#f97316", bg: "#fed7aa" },
  { icon: Waves,     key: "rescue",     color: "#0ea5e9", bg: "#e0f2fe" },
  { icon: Shield,    key: "prevention", color: "#16a34a", bg: "#dcfce7" },
];

type CenterData = { id: string; phone: string; lat?: number; lng?: number };
const CENTERS_DATA: CenterData[] = [
  { id: "alger",       phone: "021711414", lat: 36.7538, lng: 3.0588 },
  { id: "oran",        phone: "041390014", lat: 35.6911, lng: -0.6417 },
  { id: "constantine", phone: "031920014", lat: 36.3650, lng: 6.6147 },
  { id: "annaba",      phone: "038860014", lat: 36.9000, lng: 7.7667 },
  { id: "setif",       phone: "036910014", lat: 36.1900, lng: 5.4133 },
];

function Page() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <ScreenHeader title={t("civil-protection.title")} />
      <div dir="rtl" className="px-4 pb-24 space-y-6">
        {/* Hero emergency card */}
        <div className="mt-3 rounded-3xl bg-gradient-to-br from-red-700 via-red-800 to-orange-900 border-2 border-red-600/60 p-5 shadow-[0_8px_40px_-8px_rgba(220,38,38,0.55)]">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-1.5 shrink-0">
              <img src={civilProtectionLogo.url} alt={t("civil-protection.logoAlt")} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-black text-lg leading-tight">{t("civil-protection.agencyName")}</h2>
              <p className="text-red-100 text-xs mt-1">{t("civil-protection.emergencyDesc")}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <a href="tel:14" className="flex items-center justify-center gap-2 rounded-2xl bg-white text-red-700 py-3 font-black active:scale-95 transition">
              <Phone className="w-5 h-5" /> {t("civil-protection.call14")}
            </a>
            <a href="tel:1021" className="flex items-center justify-center gap-2 rounded-2xl bg-red-900/70 border border-red-300/40 text-white py-3 font-black active:scale-95 transition">
              <Phone className="w-5 h-5" /> {t("civil-protection.call1021")}
            </a>
          </div>
        </div>

        {/* Sections */}
        <section>
          <h3 className="font-black text-base mb-3 text-foreground">{t("civil-protection.sectionsTitle")}</h3>
          <div className="grid grid-cols-2 gap-3">
            {SECTIONS_DATA.map((s) => (
              <div key={s.key} className="rounded-2xl p-3 bg-card border border-border">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <h4 className="mt-2 font-bold text-sm text-foreground">{t(`civil-protection.sections.${s.key}.name`)}</h4>
                <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{t(`civil-protection.sections.${s.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Centers */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-base text-foreground">{t("civil-protection.nearbyCenters")}</h3>
            <Link to="/search" className="text-primary text-xs font-medium flex items-center gap-1">
              <Search className="w-3 h-3" /> {t("civil-protection.search")}
            </Link>
          </div>
          <div className="space-y-2.5">
            {CENTERS_DATA.map((c) => (
              <div key={c.id} className="rounded-2xl bg-card border border-border p-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-foreground leading-tight">{t(`civil-protection.centers.${c.id}.name`)}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t(`civil-protection.centers.${c.id}.wilaya`)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openMap(c.lat, c.lng, t(`civil-protection.centers.${c.id}.name`))}
                    className="flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold bg-primary/10 text-primary active:scale-95 transition"
                  >
                    <MapIcon className="w-3.5 h-3.5" /> {t("civil-protection.viewOnMap")}
                  </button>
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold bg-red-600 text-white active:scale-95 transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> {t("civil-protection.call")}
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Stethoscope, Building2, Pill, Droplet, Accessibility, Shield, FlaskConical, HandHeart, Truck, Clock } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";

export const Route = createFileRoute("/add")({ component: Page });

type Item = { icon: any; label: string; to: string; color: string; bg: string; soon?: boolean };

function Page() {
  const { t } = useTranslation();

  const items: Item[] = [
    { icon: Stethoscope, label: t("add.addDoctor"), to: "/add-doctor", color: "#0891b2", bg: "#cffafe" },
    { icon: Building2, label: t("add.addHospital"), to: "/add-hospital", color: "#3b82f6", bg: "#dbeafe" },
    { icon: Pill, label: t("add.addPharmacy"), to: "/add-pharmacy", color: "#10b981", bg: "#d1fae5" },
    { icon: Clock, label: t("add.addOnCallPharmacy"), to: "/add-on-call-pharmacy", color: "#059669", bg: "#d1fae5" },
    { icon: Droplet, label: t("add.addDonor"), to: "/add-donor", color: "#ef4444", bg: "#fee2e2" },
    { icon: Accessibility, label: t("add.addEquipment"), to: "/add-equipment", color: "#8b5cf6", bg: "#ede9fe" },
    { icon: Shield, label: t("add.addCivilProtection"), to: "/add-civil-protection", color: "#dc2626", bg: "#fee2e2" },
    { icon: FlaskConical, label: t("add.addLab"), to: "/add-lab", color: "#0ea5e9", bg: "#e0f2fe" },
    { icon: HandHeart, label: t("add.addCharity"), to: "/add-charity", color: "#f59e0b", bg: "#fef3c7" },
    { icon: Truck, label: t("add.addAmbulance"), to: "/add-ambulance", color: "#f97316", bg: "#ffedd5" },
  ];

  return (
    <AppShell>
      <ScreenHeader title={t("add.title")} />
      <div dir="rtl" className="grid grid-cols-2 gap-3 p-4">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className="relative flex flex-col items-center gap-3 rounded-2xl bg-card border border-border p-5 active:scale-95 transition-transform"
          >
            {it.soon && (
              <span className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600">
                {t("add.soon")}
              </span>
            )}
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: it.bg, color: it.color }}
            >
              <it.icon className="h-7 w-7" />
            </div>
            <span className="text-sm font-semibold text-center leading-tight">{it.label}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

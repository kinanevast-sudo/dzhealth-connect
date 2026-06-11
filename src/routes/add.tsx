import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope, Building2, Pill, Droplet, Accessibility, PawPrint } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";

export const Route = createFileRoute("/add")({ component: Page });
const items = [
  { icon: Stethoscope, label: "إضافة طبيب", to: "/doctors" },
  { icon: Building2, label: "إضافة مستشفى", to: "/hospitals" },
  { icon: Pill, label: "إضافة صيدلية", to: "/pharmacies" },
  { icon: Droplet, label: "تسجيل متبرع جديد", to: "/donors" },
  { icon: Accessibility, label: "إضافة معدات طبية", to: "/equipment" },
  { icon: PawPrint, label: "طبيب بيطري", to: "/search" },
];
function Page() {
  return (
    <AppShell>
      <ScreenHeader title="إضافة معلومات" />
      <div className="grid grid-cols-2 gap-3 p-4">
        {items.map((it) => (
          <Link key={it.label} to={it.to} className="flex flex-col items-center gap-3 rounded-2xl bg-surface card-elevated p-5 active:scale-95 transition-transform">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground neon-glow"><it.icon className="h-7 w-7" /></div>
            <span className="text-sm font-semibold text-center">{it.label}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

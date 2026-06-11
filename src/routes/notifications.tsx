import { createFileRoute } from "@tanstack/react-router";
import { Bell, Droplet, CalendarCheck } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";

export const Route = createFileRoute("/notifications")({ component: Page });
const items = [
  { icon: CalendarCheck, title: "تذكير بموعد", body: "موعدك مع د. أمين بن علي غدًا الساعة 10:00", t: "منذ ساعة", color: "var(--primary)" },
  { icon: Droplet, title: "طلب تبرع طارئ", body: "مطلوب فصيلة O+ في عنابة", t: "منذ 3 ساعات", color: "var(--blood)" },
];
function Page() {
  return (
    <AppShell>
      <ScreenHeader title="الإشعارات" />
      <div className="space-y-3 px-4 pt-3">
        {items.map((n, i) => (
          <div key={i} className="flex gap-3 rounded-2xl bg-surface card-elevated p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${n.color}22` }}>
              <n.icon className="h-5 w-5" style={{ color: n.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{n.title}</p>
              <p className="text-[11px] text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{n.t}</p>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

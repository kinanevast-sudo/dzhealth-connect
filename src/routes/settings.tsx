import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";

export const Route = createFileRoute("/settings")({ component: Page });
function Page() {
  return (
    <AppShell>
      <ScreenHeader title="الإعدادات" />
      <div className="space-y-3 px-4 pt-4">
        {[
          { label: "الوضع الداكن", on: true },
          { label: "الإشعارات", on: true },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-2xl bg-surface card-elevated px-4 py-3.5">
            <span className="text-sm">{r.label}</span>
            <div className={`flex h-6 w-11 items-center rounded-full p-0.5 ${r.on ? "gradient-primary" : "bg-muted"}`}>
              <div className={`h-5 w-5 rounded-full bg-white ${r.on ? "mr-auto" : ""}`} />
            </div>
          </div>
        ))}
        <div className="rounded-2xl bg-surface card-elevated p-4">
          <p className="text-sm font-bold">اللغة</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["العربية","Français","English"].map((l, i) => (
              <button key={l} className={`rounded-full py-2 text-xs font-semibold ${i===0 ? "gradient-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

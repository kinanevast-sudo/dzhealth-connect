import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun, Bell, Globe } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { useTheme } from "@/lib/theme";
import { useState } from "react";

export const Route = createFileRoute("/settings")({ component: Page });

function Page() {
  const { theme, toggle } = useTheme();
  const [notif, setNotif] = useState(true);
  const [lang, setLang] = useState<"ar" | "fr" | "en">("ar");

  return (
    <AppShell>
      <ScreenHeader title="الإعدادات" />
      <div className="space-y-3 px-4 pt-4">
        <Row
          label={theme === "light" ? "الوضع الفاتح" : "الوضع الداكن"}
          icon={theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          on={theme === "dark"}
          onChange={toggle}
        />
        <Row
          label="الإشعارات"
          icon={<Bell className="h-4 w-4" />}
          on={notif}
          onChange={() => setNotif((s) => !s)}
        />
        <div className="rounded-2xl bg-surface card-elevated p-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold">اللغة</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {([["ar","العربية"],["fr","Français"],["en","English"]] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setLang(k)}
                className={`rounded-full py-2 text-xs font-semibold transition ${lang===k ? "gradient-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, icon, on, onChange }: { label: string; icon: React.ReactNode; on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="flex w-full items-center justify-between rounded-2xl bg-surface card-elevated px-4 py-3.5">
      <div className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${on ? "gradient-primary" : "bg-muted"}`}>
        <div className={`h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-0" : "translate-x-5"}`} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
    </button>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun, Bell, Globe, MapPin } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { useTheme } from "@/lib/theme";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/settings")({ component: Page });

const LANG_KEY = "dzhealth-lang";
const NOTIF_KEY = "dzhealth-notif";

function Page() {
  const { theme, toggle } = useTheme();
  const [notif, setNotif] = useState(true);
  const [lang, setLang] = useState<"ar" | "fr" | "en">("ar");
  const [geoState, setGeoState] = useState<"prompt" | "granted" | "denied">("prompt");

  useEffect(() => {
    const l = (localStorage.getItem(LANG_KEY) as any) || "ar";
    setLang(l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
    const n = localStorage.getItem(NOTIF_KEY);
    if (n != null) setNotif(n === "1");
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" as PermissionName })
        .then((r) => setGeoState(r.state as any))
        .catch(() => {});
    }
  }, []);

  const setLanguage = (k: "ar" | "fr" | "en") => {
    setLang(k);
    localStorage.setItem(LANG_KEY, k);
    document.documentElement.dir = k === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = k;
  };

  const toggleNotif = async () => {
    const next = !notif;
    setNotif(next);
    localStorage.setItem(NOTIF_KEY, next ? "1" : "0");
    if (next && "Notification" in window && Notification.permission === "default") {
      try { await Notification.requestPermission(); } catch {}
    }
  };

  const requestGeo = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => setGeoState("granted"),
      () => setGeoState("denied"),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  return (
    <AppShell>
      <ScreenHeader title="الإعدادات" />
      <div dir="rtl" className="space-y-3 px-4 pt-4">
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
          onChange={toggleNotif}
        />
        <Row
          label={geoState === "granted" ? "تم تفعيل الموقع" : "تفعيل الموقع (GPS)"}
          icon={<MapPin className="h-4 w-4" />}
          on={geoState === "granted"}
          onChange={requestGeo}
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
                onClick={() => setLanguage(k)}
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
        <div className={`h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
    </button>
  );
}

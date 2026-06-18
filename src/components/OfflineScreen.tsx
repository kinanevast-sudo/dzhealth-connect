import { useEffect, useState, type ReactNode } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

export function OfflineScreen({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (online) return <>{children}</>;

  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-6"
    >
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-black text-foreground">{t("common.offline")}</h1>
          <p className="text-sm text-muted-foreground">{t("common.offlineDesc")}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-2.5 text-sm font-bold text-primary-foreground neon-glow active:scale-95 transition-transform"
        >
          <RefreshCw className="w-4 h-4" />
          {t("common.retry")}
        </button>
      </div>
    </div>
  );
}

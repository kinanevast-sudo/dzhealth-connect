import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Moon, Sun, Globe, Bell, Shield, HelpCircle, Info,
  LogOut, Monitor, ChevronRight, Smartphone, Heart, MapPin, Droplet, Target, Zap,
} from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { useTheme, type Theme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({ component: Page });

const LANG_KEY = "dzhealth-lang";
const NOTIF_KEY = "dzhealth-notif";

type Lang = "ar" | "fr" | "en";

function Page() {
  const { theme, set: setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [notif, setNotif] = useState(true);
  const [lang, setLang] = useState<Lang>("ar");
  const [geoState, setGeoState] = useState<"prompt" | "granted" | "denied">("prompt");
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [bloodPrefs, setBloodPrefs] = useState({
    notify_blood_enabled: true,
    notify_blood_match_only: true,
    notify_blood_critical_same_baladiya: true,
  });

  useEffect(() => {
    const l = (localStorage.getItem(LANG_KEY) as Lang) || "ar";
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
    supabase.auth.getUser().then(async ({ data }) => {
      setEmail(data.user?.email ?? null);
      setUserId(data.user?.id ?? null);
      if (data.user) {
        const { data: p } = await supabase.from("profiles")
          .select("notify_blood_enabled,notify_blood_match_only,notify_blood_critical_same_baladiya")
          .eq("user_id", data.user.id).maybeSingle();
        if (p) setBloodPrefs({
          notify_blood_enabled: p.notify_blood_enabled ?? true,
          notify_blood_match_only: p.notify_blood_match_only ?? true,
          notify_blood_critical_same_baladiya: p.notify_blood_critical_same_baladiya ?? true,
        });
      }
    });
  }, []);

  const updateBloodPref = async (key: keyof typeof bloodPrefs) => {
    const next = { ...bloodPrefs, [key]: !bloodPrefs[key] };
    setBloodPrefs(next);
    if (!userId) return;
    const { error } = await supabase.from("profiles").update({ [key]: next[key] } as any).eq("user_id", userId);
    if (error) toast.error("تعذّر حفظ الإعداد");
  };

  const setLanguage = (k: Lang) => {
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
    if (!navigator.geolocation) return toast.error("الموقع غير مدعوم");
    navigator.geolocation.getCurrentPosition(
      () => { setGeoState("granted"); toast.success("تم تفعيل الموقع"); },
      () => { setGeoState("denied"); toast.error("تم رفض الإذن"); },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/auth" });
  };

  const LANGS: { key: Lang; label: string; flag: string }[] = [
    { key: "ar", label: "العربية", flag: "🇩🇿" },
    { key: "fr", label: "Français", flag: "🇫🇷" },
    { key: "en", label: "English", flag: "🇬🇧" },
  ];

  const THEMES: { key: Theme; label: string; icon: React.ReactNode }[] = [
    { key: "light", label: "فاتح", icon: <Sun className="w-4 h-4" /> },
    { key: "dark", label: "داكن", icon: <Moon className="w-4 h-4" /> },
    { key: "system", label: "النظام", icon: <Monitor className="w-4 h-4" /> },
  ];

  const MENU_ROWS = [
    {
      icon: <Bell className="w-4 h-4" />,
      label: "الإشعارات",
      action: () => navigate({ to: "/notifications" }),
    },
    {
      icon: <Shield className="w-4 h-4" />,
      label: "سياسة الخصوصية",
      action: () => toast.info("سياسة الخصوصية — قريباً"),
    },
    {
      icon: <HelpCircle className="w-4 h-4" />,
      label: "مركز المساعدة",
      action: () => toast.info("مركز المساعدة — قريباً"),
    },
    {
      icon: <Info className="w-4 h-4" />,
      label: "عن التطبيق",
      action: () => toast.info("DZHealth v1.0.0 — كل الخدمات الصحية في مكان واحد"),
    },
  ];

  return (
    <AppShell>
      <ScreenHeader title="الإعدادات" />
      <div dir="rtl" className="px-4 py-4 space-y-4 pb-24">
        {email && (
          <p className="text-sm text-muted-foreground -mt-1">{email}</p>
        )}

        {/* Appearance */}
        <Section label="المظهر">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              </div>
              <p className="font-semibold text-sm flex-1">الوضع</p>
            </div>
            <div className="flex gap-2">
              {THEMES.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95",
                    theme === key
                      ? "gradient-primary text-primary-foreground neon-glow"
                      : "bg-surface-2 text-muted-foreground"
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Language */}
        <Section label="اللغة">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <p className="font-semibold text-sm flex-1">اللغة</p>
            </div>
            <div className="flex gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setLanguage(l.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all active:scale-95",
                    lang === l.key
                      ? "gradient-primary text-primary-foreground neon-glow"
                      : "bg-surface-2 text-muted-foreground"
                  )}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Preferences (toggles) */}
        <Section label="التفضيلات">
          <ToggleRow
            icon={<Bell className="w-4 h-4" />}
            label="الإشعارات"
            on={notif}
            onChange={toggleNotif}
          />
          <ToggleRow
            icon={<MapPin className="w-4 h-4" />}
            label={geoState === "granted" ? "الموقع مفعّل (GPS)" : "تفعيل الموقع (GPS)"}
            on={geoState === "granted"}
            onChange={requestGeo}
            last
          />
        </Section>

        {/* Blood notifications */}
        <Section label="إشعارات طلبات الدم">
          <ToggleRow
            icon={<Droplet className="w-4 h-4" />}
            label="استقبال إشعارات طلبات الدم"
            on={bloodPrefs.notify_blood_enabled}
            onChange={() => updateBloodPref("notify_blood_enabled")}
          />
          <ToggleRow
            icon={<Target className="w-4 h-4" />}
            label="فصيلتي المتوافقة فقط"
            on={bloodPrefs.notify_blood_match_only}
            onChange={() => updateBloodPref("notify_blood_match_only")}
          />
          <ToggleRow
            icon={<Zap className="w-4 h-4" />}
            label="تنبيه إضافي للحالات الحرجة في بلديتي"
            on={bloodPrefs.notify_blood_critical_same_baladiya}
            onChange={() => updateBloodPref("notify_blood_critical_same_baladiya")}
            last
          />
        </Section>

        {/* Account / Menu */}
        <Section label="الحساب">
          <div className="overflow-hidden">
            {MENU_ROWS.map(({ icon, label, action }, i) => (
              <motion.button
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={action}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 cursor-pointer hover:bg-surface-2 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-2 text-foreground">
                  {icon}
                </div>
                <span className="text-sm font-medium flex-1 text-start">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
              </motion.button>
            ))}
          </div>
        </Section>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl py-4 cursor-pointer hover:bg-destructive/15 transition-colors active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold">تسجيل الخروج</span>
        </motion.button>

        {/* Footer */}
        <div className="text-center py-4 space-y-2">
          <div className="flex items-center justify-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground/50">DZHealth v1.0.0</p>
          </div>
          <p className="text-xs text-muted-foreground/40">كل الخدمات الصحية في مكان واحد</p>
          <div className="flex justify-center gap-0.5 mt-3">
            <div className="w-8 h-1.5 bg-green-600 rounded-s-full" />
            <div className="w-8 h-1.5 bg-white" />
            <div className="w-px h-1.5 bg-red-600" />
            <div className="w-8 h-1.5 bg-white" />
            <div className="w-8 h-1.5 bg-green-600 rounded-e-full" />
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Heart className="w-2.5 h-2.5 text-red-500" />
            <p className="text-[10px] text-muted-foreground/40">Made with care</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden card-elevated">
      <div className="px-4 pt-3 pb-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ icon, label, on, onChange, last }: { icon: React.ReactNode; label: string; on: boolean; onChange: () => void; last?: boolean }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-surface-2 transition-colors",
        !last && "border-b border-border"
      )}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
        {icon}
      </div>
      <span className="text-sm font-medium flex-1 text-start">{label}</span>
      <div className={cn("h-6 w-11 rounded-full p-0.5 transition", on ? "gradient-primary" : "bg-muted")}>
        <div className={cn("h-5 w-5 rounded-full bg-white shadow transition-transform", on ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0")} />
      </div>
    </button>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User as UserIcon, Mail, Phone, ChevronLeft, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";

export const Route = createFileRoute("/profile")({ component: Page });

function Page() {
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", u.user.id).maybeSingle();
      setProfile(data);
    })();
  }, []);

  const rows = [
    { label: "ملفي الشخصي" }, { label: "الأمان والخصوصية" },
    { label: "اللغة", value: "العربية" }, { label: "الإشعارات" },
    { label: "المساعدة والدعم" }, { label: "الخصوصية والشروط" }, { label: "حول التطبيق" },
  ];

  return (
    <AppShell>
      <ScreenHeader title="الملف الشخصي" />
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 rounded-2xl bg-surface card-elevated p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-primary-foreground"><UserIcon className="h-7 w-7" /></div>
          <div>
            <p className="text-sm font-bold">{profile?.full_name ?? "زائر"}</p>
            <p className="text-[11px] text-muted-foreground">{profile?.email ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">{profile?.phone ?? "أضف رقم هاتفك"}</p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-surface card-elevated">
          {rows.map((r, i) => (
            <button key={r.label} className={`flex w-full items-center justify-between px-4 py-3.5 text-sm ${i ? "border-t border-border/50" : ""}`}>
              <span>{r.label}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">{r.value} <ChevronLeft className="h-4 w-4" /></span>
            </button>
          ))}
        </div>

        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/auth"; }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/15 py-3.5 text-sm font-bold text-destructive">
          <LogOut className="h-4 w-4" /> تسجيل الخروج
        </button>
      </div>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Droplet, CalendarCheck, Info } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/notifications")({ component: Page });

const iconFor = (kind?: string) => {
  if (kind === "appointment") return { Icon: CalendarCheck, color: "var(--primary)" };
  if (kind === "blood" || kind === "donation") return { Icon: Droplet, color: "#ef4444" };
  if (kind === "alert") return { Icon: Bell, color: "#f59e0b" };
  return { Icon: Info, color: "#0891b2" };
};

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "الآن";
  if (d < 3600) return `منذ ${Math.floor(d / 60)} د`;
  if (d < 86400) return `منذ ${Math.floor(d / 3600)} س`;
  return `منذ ${Math.floor(d / 86400)} ي`;
}

function Page() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,kind,read,created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <ScreenHeader title="الإشعارات" />
      <div dir="rtl" className="space-y-3 px-4 pt-3">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-surface card-elevated p-4 text-sm text-red-500">
            تعذّر تحميل الإشعارات
          </div>
        )}
        {!isLoading && !error && (data?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface card-elevated p-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-semibold">لا توجد إشعارات حالياً</p>
            <p className="text-xs text-muted-foreground">سنُعلمك فور وصول أي تنبيه جديد</p>
          </div>
        )}
        {data?.map((n: any) => {
          const { Icon, color } = iconFor(n.kind);
          return (
            <div key={n.id} className="flex gap-3 rounded-2xl bg-surface card-elevated p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${color}22` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <p className="text-sm font-bold">{n.title}</p>
                <p className="text-[11px] text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

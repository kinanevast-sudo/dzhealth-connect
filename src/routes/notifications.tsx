import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Trash2, CheckCheck, CalendarCheck, Droplet, Info, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({ component: Page });

type Notif = {
  id: string;
  title: string;
  body: string | null;
  kind: string | null;
  read: boolean | null;
  created_at: string;
};

type Cat = "all" | "appointment" | "blood" | "system";

const META: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  appointment: { icon: <CalendarCheck className="w-4 h-4" />, color: "text-primary", bg: "bg-primary/10", label: "المواعيد" },
  blood: { icon: <Droplet className="w-4 h-4" />, color: "text-red-500", bg: "bg-red-500/10", label: "تبرع بالدم" },
  alert: { icon: <Bell className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-500/10", label: "تنبيه" },
  system: { icon: <Info className="w-4 h-4" />, color: "text-muted-foreground", bg: "bg-secondary", label: "النظام" },
};
const DEFAULT_META = META.system;

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "الآن";
  if (d < 3600) return `منذ ${Math.floor(d / 60)} د`;
  if (d < 86400) return `منذ ${Math.floor(d / 3600)} س`;
  if (d < 604800) return `منذ ${Math.floor(d / 86400)} ي`;
  return `منذ ${Math.floor(d / 604800)} أ`;
}

function bucket(kind?: string | null): Cat {
  if (kind === "appointment") return "appointment";
  if (kind === "blood" || kind === "donation") return "blood";
  if (kind === "alert" || kind === "system" || !kind) return "system";
  return "system";
}

function Page() {
  const qc = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<Cat>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<Notif[]> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,kind,read,created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data ?? []) as Notif[];
    },
  });

  // Realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || cancelled) return;
      channel = supabase
        .channel(`notif-${u.user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${u.user.id}` },
          () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
            qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
          },
        )
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [qc]);

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter((n) => bucket(n.kind) === activeFilter);
  }, [notifications, activeFilter]);

  const FILTER_LABELS: { key: Cat; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "appointment", label: "المواعيد" },
    { key: "blood", label: "تبرع بالدم" },
    { key: "system", label: "النظام" },
  ];

  const handleMarkRead = async (id: string) => {
    qc.setQueryData<Notif[]>(["notifications"], (prev) =>
      prev?.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
  };

  const handleMarkAllRead = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    qc.setQueryData<Notif[]>(["notifications"], (prev) => prev?.map((n) => ({ ...n, read: true })));
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", u.user.id).eq("read", false);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
  };

  const handleDelete = async (id: string) => {
    qc.setQueryData<Notif[]>(["notifications"], (prev) => prev?.filter((n) => n.id !== id));
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/home" className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform shrink-0">
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-black text-lg leading-tight truncate">الإشعارات</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary font-bold">{unreadCount}</span> غير مقروءة
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs text-primary font-semibold bg-primary/10 px-3 py-2 rounded-xl cursor-pointer active:scale-95 transition-transform"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                قراءة الكل
              </button>
            )}
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTER_LABELS.map(({ key, label }) => {
            const count =
              key === "all"
                ? unreadCount
                : notifications.filter((n) => bucket(n.kind) === key && !n.read).length;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 cursor-pointer transition-all",
                  activeFilter === key ? "bg-foreground text-background" : "bg-secondary text-muted-foreground",
                )}
              >
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      "min-w-4 h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-black",
                      activeFilter === key ? "bg-background text-foreground" : "bg-red-500 text-white",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 w-full rounded-2xl bg-surface animate-pulse" />
          ))
        ) : error ? (
          <div className="rounded-2xl bg-surface card-elevated p-4 text-sm text-red-500 text-center">
            تعذّر تحميل الإشعارات
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 gap-4"
              >
                <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center">
                  <BellOff className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="font-bold text-foreground">لا توجد إشعارات</p>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  سنُعلمك فور وصول أي تنبيه جديد بخصوص المواعيد، التبرع بالدم، أو تحديثات النظام
                </p>
              </motion.div>
            ) : (
              filtered.map((n, i) => {
                const meta = META[n.kind ?? "system"] ?? DEFAULT_META;
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    onClick={() => { if (!n.read) handleMarkRead(n.id); }}
                    className={cn(
                      "bg-card rounded-2xl border p-4 flex items-start gap-3 cursor-pointer transition-all active:scale-[0.98]",
                      !n.read ? "border-primary/25 shadow-sm shadow-primary/10" : "border-border",
                    )}
                  >
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 relative", meta.bg, meta.color)}>
                      {meta.icon}
                      {!n.read && (
                        <span className="absolute -top-1 -start-1 w-3 h-3 bg-primary rounded-full border-2 border-card" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={cn("text-sm font-bold leading-tight", !n.read ? "text-foreground" : "text-muted-foreground")}>
                          {n.title}
                        </h3>
                        <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                      )}
                      <div className={cn("inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-lg text-[10px] font-semibold", meta.bg, meta.color)}>
                        {meta.icon}
                        <span>{meta.label}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                      className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-destructive/20 transition-colors active:scale-95"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

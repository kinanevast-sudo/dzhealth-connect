import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  LayoutDashboard, ClipboardList, ShieldCheck, Loader2, BarChart3, Home,
  Users as UsersIcon, FileText, Bell, Settings, Image as ImageIcon, Activity,
  Brain, History, Search, Maximize2, ChevronDown, Heart, AlertTriangle,
  Database, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { RESOURCES } from "@/lib/admin/resources";

export const Route = createFileRoute("/_authenticated/manage")({
  ssr: false,
  component: ManageLayout,
});

type GateState = "checking" | "allowed" | "denied" | "no-super-admin";

function ManageLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState<GateState>("checking");
  const [claiming, setClaiming] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [profile, setProfile] = useState<{ name: string; avatar: string | null } | null>(null);

  // Mobile sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const check = async () => {
    setState("checking");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { navigate({ to: "/auth" }); return; }
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: u.user.id });
    if (isAdmin) {
      setState("allowed");
      const { data: p } = await supabase.from("profiles").select("full_name, avatar_url, email").eq("user_id", u.user.id).maybeSingle();
      setProfile({ name: p?.full_name || p?.email?.split("@")[0] || "Admin", avatar: p?.avatar_url ?? null });
      return;
    }
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "super_admin").limit(1);
    if (!roles || roles.length === 0) setState("no-super-admin");
    else setState("denied");
  };

  useEffect(() => { check(); }, []);

  useEffect(() => {
    if (state !== "allowed") return;
    const load = async () => {
      const { count } = await supabase.from("pending_submissions").select("id", { count: "exact", head: true }).eq("status", "pending");
      setPendingCount(count ?? 0);
    };
    load();
    const ch = supabase.channel("manage-shell-pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "pending_submissions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [state]);

  const claim = async () => {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_super_admin_bootstrap");
    setClaiming(false);
    if (error) { toast.error(error.message); return; }
    if (data) { toast.success(t("manage.bootstrap.success")); check(); }
    else { toast.error(t("manage.bootstrap.already")); check(); }
  };

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "no-super-admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] px-4">
        <div className="max-w-md w-full bg-[#111a2e] border border-white/10 rounded-2xl p-6 text-center space-y-4">
          <ShieldCheck className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-xl font-bold text-white">{t("manage.bootstrap.title")}</h1>
          <p className="text-sm text-slate-400">{t("manage.bootstrap.desc")}</p>
          <Button onClick={claim} disabled={claiming} className="w-full">
            {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : t("manage.bootstrap.claim")}
          </Button>
          <Link to="/home" className="block text-xs text-slate-500 hover:text-white">{t("manage.backHome")}</Link>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] px-4">
        <div className="max-w-md w-full bg-[#111a2e] border border-white/10 rounded-2xl p-6 text-center space-y-4">
          <h1 className="text-xl font-bold text-white">{t("manage.denied.title")}</h1>
          <p className="text-sm text-slate-400">{t("manage.denied.desc")}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/home">{t("manage.backHome")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="manage-shell min-h-screen bg-[#0b1220] text-slate-200 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <ManageSidebar pendingCount={pendingCount} profile={profile} />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 h-full animate-in slide-in-from-right">
            <ManageSidebar pendingCount={pendingCount} profile={profile} />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 left-3 h-9 w-9 grid place-items-center rounded-lg bg-[#111a2e] border border-white/10 text-slate-300"
              aria-label="close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <ManageHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function ManageHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-20 h-16 bg-[#0b1220]/80 backdrop-blur border-b border-white/5 flex items-center gap-2 sm:gap-4 px-3 sm:px-6">
      <button
        onClick={onMenuClick}
        className="h-10 w-10 grid place-items-center rounded-xl bg-[#111a2e] border border-white/5 hover:border-white/10 transition shrink-0"
        aria-label="menu"
      >
        <Menu className="h-4 w-4 text-slate-300" />
      </button>
      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder={t("manage.searchPlaceholder", "ابحث في لوحة التحكم...")}
            className="w-full h-10 rounded-xl bg-[#111a2e] border border-white/5 focus:border-primary/60 outline-none pr-10 pl-4 text-sm placeholder:text-slate-500 transition"
          />
        </div>
      </div>
      <button className="h-10 w-10 grid place-items-center rounded-xl bg-[#111a2e] border border-white/5 hover:border-white/10 transition text-slate-300">
        <Maximize2 className="h-4 w-4" />
      </button>
      <button className="relative h-10 w-10 grid place-items-center rounded-xl bg-[#111a2e] border border-white/5 hover:border-white/10 transition text-slate-300">
        <Bell className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center">5</span>
      </button>
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-violet-500 grid place-items-center text-xs font-bold text-white ring-2 ring-white/10">
        <UsersIcon className="h-4 w-4" />
      </div>
    </header>
  );
}

function ManageSidebar({ pendingCount, profile }: { pendingCount: number; profile: { name: string; avatar: string | null } | null }) {
  const { t, i18n } = useTranslation();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const lng = (["ar", "fr", "en"].includes(i18n.language) ? i18n.language : "ar") as "ar" | "fr" | "en";

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  type Item = { to?: string; label: string; icon: typeof Home; badge?: number; badgeColor?: string; exact?: boolean; disabled?: boolean };
  const nav: Item[] = [
    { to: "/manage", label: t("manage.nav.dashboard"), icon: LayoutDashboard, exact: true },
    { label: "المستخدمين", icon: UsersIcon, disabled: true },
    { label: "المحتوى", icon: FileText, disabled: true },
    { to: "/manage/submissions", label: "المراجعة والطلبات", icon: ClipboardList, badge: pendingCount, badgeColor: "bg-rose-500" },
    { label: "البلاغات والشكاوى", icon: AlertTriangle, badge: 8, badgeColor: "bg-amber-500", disabled: true },
    { to: "/manage/analytics", label: "التحليلات والتقارير", icon: BarChart3 },
    { label: "النظام والإعدادات", icon: Settings, disabled: true },
    { label: "الإشعارات", icon: Bell, disabled: true },
    { label: "الملفات والوسائط", icon: ImageIcon, disabled: true },
    { label: "مراقبة النظام", icon: Activity, disabled: true },
    { label: "الذكاء الاصطناعي", icon: Brain, disabled: true },
    { label: "سجل النشاط", icon: History, disabled: true },
  ];

  return (
    <aside className="w-[260px] shrink-0 bg-[#0e1729] border-l border-white/5 flex flex-col sticky top-0 h-screen">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center gap-2.5 border-b border-white/5">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 grid place-items-center shadow-lg shadow-sky-500/20">
          <Heart className="h-5 w-5 text-white" fill="currentColor" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-extrabold text-white tracking-tight">DZHealth</div>
          <div className="text-[10px] text-slate-400 font-semibold tracking-widest">ADMIN</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 no-scrollbar">
        {nav.map((it, idx) => {
          const active = it.to ? isActive(it.to, it.exact) : false;
          const content = (
            <div className={`group flex items-center gap-3 px-3 h-10 rounded-xl text-sm transition-colors relative ${
              active
                ? "bg-primary/15 text-white"
                : it.disabled
                  ? "text-slate-500 hover:bg-white/5 hover:text-slate-300 cursor-default"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}>
              {active && <span className="absolute right-0 top-1.5 bottom-1.5 w-0.5 rounded-l-full bg-primary" />}
              <it.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : ""}`} />
              <span className="flex-1 truncate">{it.label}</span>
              {it.badge != null && it.badge > 0 && (
                <span className={`h-5 min-w-[22px] px-1.5 rounded-md ${it.badgeColor || "bg-rose-500"} text-white text-[10px] font-bold grid place-items-center tabular-nums`}>
                  {it.badge}
                </span>
              )}
            </div>
          );
          return it.to && !it.disabled
            ? <Link key={idx} to={it.to}>{content}</Link>
            : <div key={idx}>{content}</div>;
        })}

        {/* Resources collapsed group */}
        <div className="pt-3 mt-3 border-t border-white/5">
          <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            {t("manage.nav.resources")}
          </div>
          {RESOURCES.slice(0, 6).map((r) => {
            const to = `/manage/resource/${r.slug}`;
            const active = pathname === to;
            return (
              <Link key={r.slug} to="/manage/resource/$slug" params={{ slug: r.slug }}>
                <div className={`flex items-center gap-3 px-3 h-9 rounded-xl text-[13px] transition-colors ${
                  active ? "bg-primary/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}>
                  <Database className="h-4 w-4 shrink-0" />
                  <span className="truncate">{r.label[lng]}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#111a2e] border border-white/5">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-500 to-violet-500 grid place-items-center text-white text-sm font-bold shrink-0 ring-2 ring-white/10 overflow-hidden">
            {profile?.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : (profile?.name?.[0]?.toUpperCase() ?? "A")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{profile?.name ?? "Admin"}</div>
            <div className="text-[10px] text-slate-500">Super Admin</div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
        </div>
      </div>
    </aside>
  );
}

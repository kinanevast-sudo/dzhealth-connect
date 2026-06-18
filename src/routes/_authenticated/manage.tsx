import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LayoutDashboard, ClipboardList, ShieldCheck, ArrowLeft, Loader2, Database } from "lucide-react";
import { RESOURCES } from "@/lib/admin/resources";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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

  const check = async () => {
    setState("checking");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { navigate({ to: "/auth" }); return; }
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: u.user.id });
    if (isAdmin) { setState("allowed"); return; }
    // Allow first-user bootstrap if no super_admin exists yet
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin")
      .limit(1);
    if (!roles || roles.length === 0) setState("no-super-admin");
    else setState("denied");
  };

  useEffect(() => { check(); }, []);

  const claim = async () => {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_super_admin_bootstrap");
    setClaiming(false);
    if (error) { toast.error(error.message); return; }
    if (data) {
      toast.success(t("manage.bootstrap.success"));
      check();
    } else {
      toast.error(t("manage.bootstrap.already"));
      check();
    }
  };

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "no-super-admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4">
          <ShieldCheck className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-xl font-bold">{t("manage.bootstrap.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("manage.bootstrap.desc")}</p>
          <Button onClick={claim} disabled={claiming} className="w-full">
            {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : t("manage.bootstrap.claim")}
          </Button>
          <Link to="/home" className="block text-xs text-muted-foreground hover:text-foreground">
            {t("manage.backHome")}
          </Link>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4">
          <h1 className="text-xl font-bold">{t("manage.denied.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("manage.denied.desc")}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/home">{t("manage.backHome")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ManageSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border px-3 bg-card/40">
            <SidebarTrigger />
            <Link to="/home" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("manage.backToApp")}
            </Link>
            <div className="flex-1" />
            <span className="text-xs font-semibold text-muted-foreground">{t("manage.title")}</span>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ManageSidebar() {
  const { t, i18n } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const lng = (["ar", "fr", "en"].includes(i18n.language) ? i18n.language : "ar") as "ar" | "fr" | "en";

  const main = [
    { to: "/manage", label: t("manage.nav.dashboard"), icon: LayoutDashboard, exact: true },
    { to: "/manage/submissions", label: t("manage.nav.submissions"), icon: ClipboardList },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("manage.title")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild isActive={isActive(it.to, it.exact)}>
                    <Link to={it.to} className="flex items-center gap-2">
                      <it.icon className="h-4 w-4" />
                      {!collapsed && <span>{it.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("manage.nav.resources")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {RESOURCES.map((r) => {
                const to = `/manage/resource/${r.slug}`;
                return (
                  <SidebarMenuItem key={r.slug}>
                    <SidebarMenuButton asChild isActive={pathname === to}>
                      <Link to="/manage/resource/$slug" params={{ slug: r.slug }} className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {!collapsed && <span className="truncate">{r.label[lng]}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

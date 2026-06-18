import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Stethoscope, Building2, Pill, Droplet, ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/manage/")({
  ssr: false,
  component: Dashboard,
});

type Counts = {
  doctors: number; hospitals: number; pharmacies: number; donors: number;
  users: number; pending: number; approved: number; rejected: number;
};

function Dashboard() {
  const { t } = useTranslation();
  const [c, setC] = useState<Counts | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const head = { count: "exact" as const, head: true };
      const [doctors, hospitals, pharmacies, donors, users, stats] = await Promise.all([
        supabase.from("doctors").select("id", head),
        supabase.from("hospitals").select("id", head),
        supabase.from("pharmacies").select("id", head),
        supabase.from("blood_donors").select("id", head),
        supabase.from("profiles").select("user_id", head),
        supabase.from("admin_submission_stats").select("*"),
      ]);
      if (cancelled) return;
      const sub = (stats.data ?? []) as Array<{ status: string; count: number }>;
      const sum = (s: string) => sub.filter((x) => x.status === s).reduce((a, b) => a + (b.count ?? 0), 0);
      setC({
        doctors: doctors.count ?? 0,
        hospitals: hospitals.count ?? 0,
        pharmacies: pharmacies.count ?? 0,
        donors: donors.count ?? 0,
        users: users.count ?? 0,
        pending: sum("pending"),
        approved: sum("approved"),
        rejected: sum("rejected"),
      });
    })();

    const ch = supabase
      .channel("manage-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "pending_submissions" }, () => {
        supabase.from("admin_submission_stats").select("*").then(({ data }) => {
          const sub = (data ?? []) as Array<{ status: string; count: number }>;
          const sum = (s: string) => sub.filter((x) => x.status === s).reduce((a, b) => a + (b.count ?? 0), 0);
          setC((prev) => prev ? { ...prev, pending: sum("pending"), approved: sum("approved"), rejected: sum("rejected") } : prev);
        });
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  const cards = [
    { label: t("manage.kpi.pending"), value: c?.pending, icon: ClipboardList, accent: "text-amber-400", link: "/manage/submissions" },
    { label: t("manage.kpi.approved"), value: c?.approved, icon: CheckCircle2, accent: "text-emerald-400" },
    { label: t("manage.kpi.rejected"), value: c?.rejected, icon: XCircle, accent: "text-rose-400" },
    { label: t("manage.kpi.users"), value: c?.users, icon: Users, accent: "text-sky-400" },
    { label: t("manage.kpi.doctors"), value: c?.doctors, icon: Stethoscope, accent: "text-fuchsia-400" },
    { label: t("manage.kpi.hospitals"), value: c?.hospitals, icon: Building2, accent: "text-indigo-400" },
    { label: t("manage.kpi.pharmacies"), value: c?.pharmacies, icon: Pill, accent: "text-teal-400" },
    { label: t("manage.kpi.donors"), value: c?.donors, icon: Droplet, accent: "text-rose-400" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("manage.dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("manage.dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Inner = (
            <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <card.icon className={`h-4 w-4 ${card.accent}`} />
              </div>
              <div className="mt-2 text-2xl font-bold tabular-nums">
                {card.value ?? "—"}
              </div>
            </div>
          );
          return card.link ? (
            <Link key={card.label} to={card.link}>{Inner}</Link>
          ) : (
            <div key={card.label}>{Inner}</div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <h2 className="text-sm font-semibold">{t("manage.dashboard.quickActions")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/manage/submissions" className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-4 py-2 text-xs font-semibold hover:bg-primary/20">
            <ClipboardList className="h-3.5 w-3.5" />
            {t("manage.dashboard.reviewPending")}
          </Link>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("manage.dashboard.morePhases")}</p>
    </div>
  );
}

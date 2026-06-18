import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Users, Stethoscope, Building2, Pill, Droplet, ClipboardList,
  CheckCircle2, XCircle, TrendingUp, TrendingDown, Activity,
  AlertTriangle, FileText, MapPin, ArrowUpRight,
} from "lucide-react";
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { WILAYA_CAPITALS } from "@/lib/wilayas-coords";

export const Route = createFileRoute("/_authenticated/manage/")({
  ssr: false,
  component: Dashboard,
});

type Counts = {
  doctors: number; hospitals: number; pharmacies: number; donors: number;
  users: number; pending: number; approved: number; rejected: number;
  appointments: number; bloodRequests: number;
  newUsers7: number; newUsersPrev7: number;
  newDoctors7: number; newDoctorsPrev7: number;
};

type DaySeries = { date: string; users: number; doctors: number; hospitals: number };
type Activity = { id: string; kind: "blood" | "appointment" | "signup" | "submission"; title: string; subtitle: string; ts: string };
type WilayaRow = { id: number; name: string; doctors: number; hospitals: number; pharmacies: number; total: number };

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

function Dashboard() {
  const { t, i18n } = useTranslation();
  const lng = (["ar", "fr", "en"].includes(i18n.language) ? i18n.language : "ar") as "ar" | "fr" | "en";
  const [c, setC] = useState<Counts | null>(null);
  const [series, setSeries] = useState<DaySeries[]>([]);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [wilayaRows, setWilayaRows] = useState<WilayaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const head = { count: "exact" as const, head: true };
    const since7 = fmtDate(daysAgo(7));
    const sincePrev14 = fmtDate(daysAgo(14));
    const since30 = fmtDate(daysAgo(30));

    const [
      doctors, hospitals, pharmacies, donors, users, stats,
      appointments, bloodReqs,
      newUsers7q, newUsersPrev7q, newDoctors7q, newDoctorsPrev7q,
      docs30, hosp30, users30,
      recentBlood, recentAppts, recentSignups, recentSubs,
      docsByWilaya, hospByWilaya, pharmByWilaya,
    ] = await Promise.all([
      supabase.from("doctors").select("id", head),
      supabase.from("hospitals").select("id", head),
      supabase.from("pharmacies").select("id", head),
      supabase.from("blood_donors").select("id", head),
      supabase.from("profiles").select("user_id", head),
      supabase.from("admin_submission_stats").select("*"),
      supabase.from("appointments").select("id", head),
      supabase.from("blood_requests").select("id", head),
      supabase.from("profiles").select("user_id", { count: "exact", head: true }).gte("created_at", since7),
      supabase.from("profiles").select("user_id", { count: "exact", head: true }).gte("created_at", sincePrev14).lt("created_at", since7),
      supabase.from("doctors").select("id", { count: "exact", head: true }).gte("created_at", since7),
      supabase.from("doctors").select("id", { count: "exact", head: true }).gte("created_at", sincePrev14).lt("created_at", since7),
      supabase.from("doctors").select("created_at").gte("created_at", since30),
      supabase.from("hospitals").select("created_at").gte("created_at", since30),
      supabase.from("profiles").select("created_at").gte("created_at", since30),
      supabase.from("blood_requests").select("id, blood_type, hospital_name, created_at, urgency").order("created_at", { ascending: false }).limit(6),
      supabase.from("appointments").select("id, scheduled_at, status, created_at").order("created_at", { ascending: false }).limit(6),
      supabase.from("profiles").select("user_id, full_name, created_at").order("created_at", { ascending: false }).limit(6),
      supabase.from("pending_submissions").select("id, content_type, status, created_at").order("created_at", { ascending: false }).limit(6),
      supabase.from("doctors").select("wilaya_id"),
      supabase.from("hospitals").select("wilaya_id"),
      supabase.from("pharmacies").select("wilaya_id"),
    ]);

    const sub = (stats.data ?? []) as Array<{ status: string; count: number }>;
    const sum = (s: string) => sub.filter((x) => x.status === s).reduce((a, b) => a + (b.count ?? 0), 0);

    setC({
      doctors: doctors.count ?? 0,
      hospitals: hospitals.count ?? 0,
      pharmacies: pharmacies.count ?? 0,
      donors: donors.count ?? 0,
      users: users.count ?? 0,
      appointments: appointments.count ?? 0,
      bloodRequests: bloodReqs.count ?? 0,
      pending: sum("pending"),
      approved: sum("approved"),
      rejected: sum("rejected"),
      newUsers7: newUsers7q.count ?? 0,
      newUsersPrev7: newUsersPrev7q.count ?? 0,
      newDoctors7: newDoctors7q.count ?? 0,
      newDoctorsPrev7: newDoctorsPrev7q.count ?? 0,
    });

    // 30-day series (we'll display last 14 visually for density)
    const buildSeries = () => {
      const map = new Map<string, DaySeries>();
      for (let i = 13; i >= 0; i--) {
        const k = fmtDate(daysAgo(i));
        map.set(k, { date: k.slice(5), users: 0, doctors: 0, hospitals: 0 });
      }
      const bump = (arr: Array<{ created_at: string | null }> | null, key: "users" | "doctors" | "hospitals") => {
        for (const r of arr ?? []) {
          if (!r.created_at) continue;
          const k = r.created_at.slice(5, 10);
          for (const [, v] of map) if (v.date === k) v[key]++;
        }
      };
      bump((users30.data as Array<{ created_at: string | null }>) ?? [], "users");
      bump((docs30.data as Array<{ created_at: string | null }>) ?? [], "doctors");
      bump((hosp30.data as Array<{ created_at: string | null }>) ?? [], "hospitals");
      return Array.from(map.values());
    };
    setSeries(buildSeries());

    // Wilaya coverage
    const countBy = (rows: Array<{ wilaya_id: number | null }> | null) => {
      const m = new Map<number, number>();
      for (const r of rows ?? []) if (r.wilaya_id != null) m.set(r.wilaya_id, (m.get(r.wilaya_id) ?? 0) + 1);
      return m;
    };
    const dMap = countBy(docsByWilaya.data as Array<{ wilaya_id: number | null }>);
    const hMap = countBy(hospByWilaya.data as Array<{ wilaya_id: number | null }>);
    const pMap = countBy(pharmByWilaya.data as Array<{ wilaya_id: number | null }>);
    const allW: WilayaRow[] = WILAYA_CAPITALS.map((w) => {
      const d = dMap.get(w.id) ?? 0, h = hMap.get(w.id) ?? 0, p = pMap.get(w.id) ?? 0;
      return { id: w.id, name: w.name_ar, doctors: d, hospitals: h, pharmacies: p, total: d + h + p };
    }).sort((a, b) => b.total - a.total);
    setWilayaRows(allW);

    // Activity feed
    const fd: Activity[] = [];
    for (const r of (recentBlood.data ?? []) as Array<{ id: string; blood_type: string | null; hospital_name: string | null; created_at: string; urgency: string | null }>) {
      fd.push({ id: `b-${r.id}`, kind: "blood", title: `${t("manage.feed.blood")} ${r.blood_type ?? ""}`, subtitle: r.hospital_name ?? "—", ts: r.created_at });
    }
    for (const r of (recentAppts.data ?? []) as Array<{ id: string; scheduled_at: string | null; status: string | null; created_at: string }>) {
      fd.push({ id: `a-${r.id}`, kind: "appointment", title: t("manage.feed.appointment"), subtitle: (r.scheduled_at ?? "").slice(0, 16).replace("T", " "), ts: r.created_at });
    }
    for (const r of (recentSignups.data ?? []) as Array<{ user_id: string; full_name: string | null; created_at: string }>) {
      fd.push({ id: `u-${r.user_id}`, kind: "signup", title: t("manage.feed.signup"), subtitle: r.full_name ?? "—", ts: r.created_at });
    }
    for (const r of (recentSubs.data ?? []) as Array<{ id: string; content_type: string; status: string; created_at: string }>) {
      fd.push({ id: `s-${r.id}`, kind: "submission", title: `${t("manage.feed.submission")} • ${r.content_type}`, subtitle: r.status, ts: r.created_at });
    }
    fd.sort((a, b) => b.ts.localeCompare(a.ts));
    setFeed(fd.slice(0, 10));
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel("manage-dashboard-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "pending_submissions" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "blood_requests" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // KPI delta helpers
  const delta = (cur: number, prev: number) => {
    if (!prev) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  };
  const userDelta = c ? delta(c.newUsers7, c.newUsersPrev7) : 0;
  const doctorDelta = c ? delta(c.newDoctors7, c.newDoctorsPrev7) : 0;

  // Content distribution
  const distribution = useMemo(() => c ? [
    { name: t("manage.kpi.doctors"), value: c.doctors, color: "hsl(199 89% 55%)" },
    { name: t("manage.kpi.pharmacies"), value: c.pharmacies, color: "hsl(142 71% 45%)" },
    { name: t("manage.kpi.hospitals"), value: c.hospitals, color: "hsl(346 87% 60%)" },
    { name: t("manage.kpi.donors"), value: c.donors, color: "hsl(38 92% 55%)" },
  ] : [], [c, t]);

  const totalContent = distribution.reduce((s, d) => s + d.value, 0);

  // Coverage score: avg coverage across wilayas weighted simply by entity count vs ideal
  const coverageScore = useMemo(() => {
    if (!wilayaRows.length) return 0;
    const covered = wilayaRows.filter((w) => w.total > 0).length;
    return Math.round((covered / wilayaRows.length) * 100);
  }, [wilayaRows]);

  const tierCounts = useMemo(() => {
    const high = wilayaRows.filter((w) => w.total >= 5).length;
    const mid = wilayaRows.filter((w) => w.total >= 2 && w.total < 5).length;
    const low = wilayaRows.filter((w) => w.total > 0 && w.total < 2).length;
    const none = wilayaRows.filter((w) => w.total === 0).length;
    return { high, mid, low, none };
  }, [wilayaRows]);

  const kpis = [
    { label: t("manage.kpi.users"), value: c?.users, icon: Users, tone: "sky", delta: userDelta, sub: t("manage.dashboard.vsPrev7") },
    { label: t("manage.kpi.doctors"), value: c?.doctors, icon: Stethoscope, tone: "violet", delta: doctorDelta, sub: t("manage.dashboard.vsPrev7") },
    { label: t("manage.kpi.pharmacies"), value: c?.pharmacies, icon: Pill, tone: "emerald", delta: null, sub: t("manage.dashboard.vsPrev7") },
    { label: t("manage.kpi.hospitals"), value: c?.hospitals, icon: Building2, tone: "rose", delta: null, sub: t("manage.dashboard.vsPrev7") },
    { label: t("manage.kpi.pending"), value: c?.pending, icon: ClipboardList, tone: "amber", delta: null, sub: `+${c?.pending ?? 0}`, link: "/manage/submissions" as const },
    { label: t("manage.kpi.bloodReqs"), value: c?.bloodRequests, icon: Droplet, tone: "orange", delta: null, sub: `+${c?.bloodRequests ?? 0}` },
  ];

  return (
    <div dir={lng === "ar" ? "rtl" : "ltr"} className="p-6 space-y-5 bg-[#0b1220] min-h-full text-slate-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">{t("manage.dashboard.title")}</h1>
      </div>

      {/* KPI cards — 7 columns on wide desktop */}
      <div className="grid grid-cols-7 gap-3">
        {kpis.map((k) => {
          const toneMap: Record<string, { bg: string; text: string; blob: string }> = {
            sky: { bg: "bg-sky-500/15", text: "text-sky-400", blob: "bg-sky-500" },
            violet: { bg: "bg-emerald-500/15", text: "text-emerald-400", blob: "bg-emerald-500" },
            emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400", blob: "bg-emerald-500" },
            rose: { bg: "bg-sky-500/15", text: "text-sky-400", blob: "bg-sky-500" },
            amber: { bg: "bg-emerald-500/15", text: "text-emerald-400", blob: "bg-emerald-500" },
            orange: { bg: "bg-rose-500/15", text: "text-rose-400", blob: "bg-rose-500" },
          };
          const tone = toneMap[k.tone];
          const inner = (
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#111a2e] p-4 hover:border-white/10 transition-all h-full">
              <div className="flex items-start justify-between gap-2">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${tone.bg} ${tone.text}`}>
                  <k.icon className="h-5 w-5" />
                </div>
                <div className="text-end">
                  <div className="text-[11px] text-slate-400 leading-tight">{k.label}</div>
                  <div className="mt-1 text-xl font-extrabold tabular-nums text-white">
                    {loading ? <span className="text-slate-600">—</span> : (k.value ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px]">
                {k.delta !== null && c ? (
                  <span className={`inline-flex items-center gap-0.5 font-semibold ${k.delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {k.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {k.delta >= 0 ? "+" : ""}{k.delta}%
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-400">{k.sub}</span>
                )}
                <span className="text-slate-500 truncate">عن الشهر الماضي</span>
              </div>
            </div>
          );
          return k.link
            ? <Link key={k.label} to={k.link} className="block">{inner}</Link>
            : <div key={k.label}>{inner}</div>;
        })}
        {/* extra placeholder card to fill 7th slot if needed */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-rose-500/15 text-rose-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="text-end">
              <div className="text-[11px] text-slate-400 leading-tight">البلاغات الجديدة</div>
              <div className="mt-1 text-xl font-extrabold tabular-nums text-white">8</div>
            </div>
          </div>
          <div className="mt-3 text-[11px]"><span className="font-semibold text-emerald-400">+3</span> <span className="text-slate-500">منذ أمس</span></div>
        </div>
      </div>


      {/* Charts row: chart + donut + live feed (3 equal cols) */}
      <div className="grid grid-cols-3 gap-4">
        {/* Activity chart */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold">{t("manage.dashboard.activity14")}</h2>
              <p className="text-xs text-slate-400">{t("manage.dashboard.activitySub")}</p>
            </div>
            <Link to="/manage/analytics" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
              {t("manage.dashboard.viewMore")} <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gUsers" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(199 89% 55%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(199 89% 55%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDocs" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142 71% 50%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(142 71% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" />
                <XAxis dataKey="date" stroke="hsl(0 0% 100% / 0.4)" fontSize={11} />
                <YAxis stroke="hsl(0 0% 100% / 0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="users" name={t("manage.kpi.users")} stroke="hsl(199 89% 55%)" fill="url(#gUsers)" strokeWidth={2} />
                <Area type="monotone" dataKey="doctors" name={t("manage.kpi.doctors")} stroke="hsl(142 71% 50%)" fill="url(#gDocs)" strokeWidth={2} />
                <Line type="monotone" dataKey="hospitals" name={t("manage.kpi.hospitals")} stroke="hsl(346 87% 60%)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution donut */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <h2 className="text-sm font-bold mb-1">{t("manage.dashboard.distribution")}</h2>
          <p className="text-xs text-slate-400 mb-3">{t("manage.dashboard.distributionSub")}</p>
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" innerRadius={60} outerRadius={85} paddingAngle={3} stroke="none">
                  {distribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-extrabold tabular-nums">{totalContent.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">{t("manage.dashboard.total")}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {distribution.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                <span className="text-slate-400 truncate">{d.name}</span>
                <span className="ms-auto font-semibold tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live activity feed (moved into middle row) */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">{t("manage.dashboard.liveActivity")}</h2>
            </div>
          </div>
          <div className="space-y-1.5 max-h-[280px] overflow-auto no-scrollbar pe-1">
            {feed.length === 0 && <div className="text-xs text-slate-400 py-8 text-center">—</div>}
            {feed.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-white/5 transition-colors">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                  a.kind === "blood" ? "bg-rose-500/10 text-rose-400" :
                  a.kind === "appointment" ? "bg-sky-500/10 text-sky-400" :
                  a.kind === "signup" ? "bg-emerald-500/10 text-emerald-400" :
                  "bg-amber-500/10 text-amber-400"
                }`}>
                  {a.kind === "blood" ? <Droplet className="h-3.5 w-3.5" /> :
                   a.kind === "appointment" ? <Activity className="h-3.5 w-3.5" /> :
                   a.kind === "signup" ? <Users className="h-3.5 w-3.5" /> :
                   <ClipboardList className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold truncate">{a.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{a.subtitle}</div>
                </div>
                <div className="text-[10px] text-slate-400 tabular-nums shrink-0">
                  {timeAgo(a.ts, lng)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coverage + Submissions + Activity */}
      {/* Coverage + Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Geographic coverage */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">{t("manage.dashboard.coverage")}</h2>
            </div>
            <span className="text-xs text-slate-400">{coverageScore}/100</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all" style={{ width: `${coverageScore}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs">
            <div className="rounded-lg bg-emerald-500/10 p-2"><div className="font-bold text-emerald-400 tabular-nums">{tierCounts.high}</div><div className="text-slate-400 text-[10px] mt-0.5">{t("manage.dashboard.tier.high")}</div></div>
            <div className="rounded-lg bg-sky-500/10 p-2"><div className="font-bold text-sky-400 tabular-nums">{tierCounts.mid}</div><div className="text-slate-400 text-[10px] mt-0.5">{t("manage.dashboard.tier.mid")}</div></div>
            <div className="rounded-lg bg-amber-500/10 p-2"><div className="font-bold text-amber-400 tabular-nums">{tierCounts.low}</div><div className="text-slate-400 text-[10px] mt-0.5">{t("manage.dashboard.tier.low")}</div></div>
            <div className="rounded-lg bg-rose-500/10 p-2"><div className="font-bold text-rose-400 tabular-nums">{tierCounts.none}</div><div className="text-slate-400 text-[10px] mt-0.5">{t("manage.dashboard.tier.none")}</div></div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold mb-2 text-slate-400">{t("manage.dashboard.topWilayas")}</div>
            <div className="space-y-1.5">
              {wilayaRows.slice(0, 5).map((w) => {
                const max = wilayaRows[0]?.total || 1;
                return (
                  <div key={w.id} className="flex items-center gap-2 text-xs">
                    <span className="w-20 truncate">{w.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(w.total / max) * 100}%` }} />
                    </div>
                    <span className="w-8 text-end tabular-nums font-semibold">{w.total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submission status */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">{t("manage.dashboard.contentReview")}</h2>
            </div>
            <Link to="/manage/submissions" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
              {t("manage.dashboard.viewMore")} <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            <SubmissionRow icon={ClipboardList} tone="amber" label={t("manage.kpi.pending")} value={c?.pending ?? 0} />
            <SubmissionRow icon={CheckCircle2} tone="emerald" label={t("manage.kpi.approved")} value={c?.approved ?? 0} />
            <SubmissionRow icon={XCircle} tone="rose" label={t("manage.kpi.rejected")} value={c?.rejected ?? 0} />
            <SubmissionRow icon={Droplet} tone="rose" label={t("manage.kpi.bloodReqs")} value={c?.bloodRequests ?? 0} />
          </div>
          {!!c?.pending && c.pending > 5 && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <span>{t("manage.dashboard.pendingAlert", { n: c.pending })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmissionRow({ icon: Icon, tone, label, value }: { icon: typeof FileText; tone: "amber" | "emerald" | "rose"; label: string; value: number }) {
  const toneCls = tone === "amber" ? "bg-amber-500/10 text-amber-400" : tone === "emerald" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 p-2.5">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${toneCls}`}><Icon className="h-4 w-4" /></div>
      <div className="text-xs flex-1">{label}</div>
      <div className="text-sm font-bold tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

function timeAgo(iso: string, lng: "ar" | "fr" | "en") {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const units: Array<[number, string, string, string]> = [
    [60, "ث", "s", "s"],
    [3600, "د", "min", "m"],
    [86400, "س", "h", "h"],
    [604800, "ي", "j", "d"],
  ];
  for (const [sec, ar, fr, en] of units) {
    if (diff < sec) {
      const v = Math.max(1, Math.floor(diff / (sec / 60)));
      return `${v}${lng === "ar" ? ar : lng === "fr" ? fr : en}`;
    }
  }
  return new Date(iso).toLocaleDateString();
}

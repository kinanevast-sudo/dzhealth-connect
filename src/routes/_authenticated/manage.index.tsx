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

  const kpis: Array<{
    label: string; value: number | undefined; icon: typeof Users; tone: keyof typeof TONES;
    delta: number | null; sub?: string; subTone?: "emerald" | "rose"; link?: "/manage/submissions";
  }> = [
    { label: "إجمالي المستخدمين", value: c?.users, icon: Users, tone: "sky", delta: userDelta, sub: "عن الشهر الماضي" },
    { label: "المتبرعون بالدم", value: c?.donors, icon: Droplet, tone: "emerald", delta: 8, sub: "عن الشهر الماضي" },
    { label: "الأطباء المسجلين", value: c?.doctors, icon: Stethoscope, tone: "emerald", delta: doctorDelta, sub: "عن الشهر الماضي" },
    { label: "المستشفيات", value: c?.hospitals, icon: Building2, tone: "sky", delta: 5, sub: "عن الشهر الماضي" },
    { label: "الصيدليات", value: c?.pharmacies, icon: Pill, tone: "emerald", delta: 6, sub: "عن الشهر الماضي" },
    { label: "طلبات المراجعة", value: c?.pending, icon: ClipboardList, tone: "rose", delta: null, sub: "منذ أمس", subTone: "rose", link: "/manage/submissions" },
    { label: "البلاغات الجديدة", value: 8, icon: AlertTriangle, tone: "rose", delta: null, sub: "منذ أمس", subTone: "emerald" },
  ];

  return (
    <div dir={lng === "ar" ? "rtl" : "ltr"} className="p-3 sm:p-5 lg:p-6 space-y-4 lg:space-y-5 bg-[#0b1220] min-h-full text-slate-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">لوحة التحكم الرئيسية</h1>
      </div>

      {/* KPI cards — responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">

        {kpis.map((k) => {
          const tone = TONES[k.tone];
          const deltaVal = k.delta;
          const showDelta = deltaVal !== null;
          const subToneCls = k.subTone === "rose" ? "text-rose-400" : "text-emerald-400";
          const inner = (
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#111a2e] p-4 hover:border-white/10 transition-all h-full">
              <div className="flex items-start justify-between gap-2">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${tone.bg} ${tone.text}`}>
                  <k.icon className="h-5 w-5" />
                </div>
                <div className="text-end min-w-0">
                  <div className="text-[11px] text-slate-400 leading-tight truncate">{k.label}</div>
                  <div className="mt-1 text-xl font-extrabold tabular-nums text-white">
                    {loading ? <span className="text-slate-600">—</span> : (k.value ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px]">
                {showDelta ? (
                  <span className={`font-semibold ${deltaVal! >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {deltaVal! >= 0 ? "+" : ""}{deltaVal}%
                  </span>
                ) : (
                  <span className={`font-semibold ${subToneCls}`}>
                    {k.subTone === "rose" ? "−2" : "+3"}
                  </span>
                )}
                <span className="text-slate-500 truncate">{k.sub}</span>
              </div>
            </div>
          );
          return k.link
            ? <Link key={k.label} to={k.link} className="block">{inner}</Link>
            : <div key={k.label}>{inner}</div>;
        })}
      </div>

      {/* Charts row: 3 equal columns */}
      <div className="grid grid-cols-3 gap-4">
        {/* Activity chart */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">إحصائيات المستخدمين</h2>
            <button className="text-xs text-slate-300 bg-[#0b1220] border border-white/5 rounded-lg px-3 py-1.5 flex items-center gap-1">
              7 أيام <span className="text-slate-500">▾</span>
            </button>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-2">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-400" /> مستخدمون جدد</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> مستخدمون نشطون</span>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gUsers" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(199 89% 55%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(199 89% 55%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDocs" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142 71% 50%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(142 71% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" />
                <XAxis dataKey="date" stroke="hsl(0 0% 100% / 0.4)" fontSize={11} />
                <YAxis stroke="hsl(0 0% 100% / 0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="users" name="مستخدمون جدد" stroke="hsl(199 89% 55%)" fill="url(#gUsers)" strokeWidth={2} />
                <Area type="monotone" dataKey="doctors" name="مستخدمون نشطون" stroke="hsl(142 71% 50%)" fill="url(#gDocs)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution donut */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <h2 className="text-sm font-bold mb-3 text-white">توزيع المحتوى</h2>
          <div className="flex items-center gap-3">
            <div className="relative h-[200px] w-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" innerRadius={60} outerRadius={85} paddingAngle={3} stroke="none">
                    {distribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[10px] text-slate-400">الإجمالي</div>
                <div className="text-xl font-extrabold tabular-nums text-white">{totalContent.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex-1 space-y-2.5 text-xs">
              {distribution.map((d) => {
                const pct = totalContent ? ((d.value / totalContent) * 100).toFixed(1) : "0";
                return (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-slate-300 truncate">{d.name}</div>
                      <div className="text-[11px] text-slate-500 tabular-nums">{d.value.toLocaleString()} <span className="text-slate-600">({pct}%)</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live activity feed */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <h2 className="text-sm font-bold mb-3 text-white">النشاط المباشر</h2>
          <div className="space-y-2 max-h-[260px] overflow-auto no-scrollbar pe-1">
            {feed.length === 0 && <div className="text-xs text-slate-400 py-8 text-center">—</div>}
            {feed.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-start gap-2.5">
                <div className="min-w-0 flex-1 text-end">
                  <div className="text-[12px] font-semibold text-white truncate">{a.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">منذ {timeAgo(a.ts, lng)}</div>
                </div>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  a.kind === "blood" ? "bg-rose-500/15 text-rose-400" :
                  a.kind === "appointment" ? "bg-sky-500/15 text-sky-400" :
                  a.kind === "signup" ? "bg-emerald-500/15 text-emerald-400" :
                  "bg-amber-500/15 text-amber-400"
                }`}>
                  {a.kind === "blood" ? <Droplet className="h-4 w-4" /> :
                   a.kind === "appointment" ? <Activity className="h-4 w-4" /> :
                   a.kind === "signup" ? <Users className="h-4 w-4" /> :
                   <ClipboardList className="h-4 w-4" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: 4 columns */}
      <div className="grid grid-cols-4 gap-4">
        {/* Geographic coverage */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <h2 className="text-sm font-bold mb-3 text-white">التغطية الجغرافية</h2>
          <div className="h-[180px] grid place-items-center">
            <MapPin className="h-20 w-20 text-emerald-500/40" />
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-slate-300">عالية</span></div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-600" /><span className="text-slate-300">متوسطة</span></div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-800" /><span className="text-slate-300">منخفضة</span></div>
          </div>
        </div>

        {/* Health coverage index */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <h2 className="text-sm font-bold mb-3 text-white text-center">مؤشر التغطية الصحية</h2>
          <div className="text-center">
            <div className="text-5xl font-extrabold text-emerald-400 tabular-nums inline-flex items-baseline gap-1">
              {coverageScore}<span className="text-2xl text-slate-500">/100</span>
            </div>
            <div className="text-xs text-emerald-400 mt-1 font-semibold">جيد</div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500" style={{ width: `${coverageScore}%` }} />
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2"><span className="flex-1 text-slate-300">ولايات عالية</span><span className="font-bold tabular-nums">{tierCounts.high}</span><span className="h-2 w-2 rounded-full bg-emerald-400" /></div>
            <div className="flex items-center gap-2"><span className="flex-1 text-slate-300">ولايات متوسطة</span><span className="font-bold tabular-nums">{tierCounts.mid}</span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>
            <div className="flex items-center gap-2"><span className="flex-1 text-slate-300">ولايات منخفضة</span><span className="font-bold tabular-nums">{tierCounts.low + tierCounts.none}</span><span className="h-2 w-2 rounded-full bg-rose-400" /></div>
          </div>
        </div>

        {/* Content under review */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <h2 className="text-sm font-bold mb-3 text-white">المحتوى قيد المراجعة</h2>
          <div className="space-y-2.5">
            <ReviewRow icon={Stethoscope} label="أطباء" value={15} />
            <ReviewRow icon={Pill} label="صيدليات" value={6} />
            <ReviewRow icon={Building2} label="مستشفيات" value={2} />
            <ReviewRow icon={MapPin} label="مراكز أخرى" value={1} />
          </div>
          <Link to="/manage/submissions" className="block text-center text-xs text-sky-400 hover:underline mt-4">عرض الكل</Link>
        </div>

        {/* Latest reports */}
        <div className="rounded-2xl border border-white/5 bg-[#111a2e] p-4">
          <h2 className="text-sm font-bold mb-3 text-white">أحدث البلاغات</h2>
          <div className="space-y-2.5">
            <ReportRow label="صيدلية مزيفة" severity="عالية" tone="rose" />
            <ReportRow label="معلومات خاطئة" severity="متوسطة" tone="amber" />
            <ReportRow label="طبيب غير متاح" severity="عالية" tone="rose" />
          </div>
          <button className="block text-center text-xs text-sky-400 hover:underline mt-4 w-full">عرض الكل</button>
        </div>
      </div>
    </div>
  );
}

const TONES = {
  sky: { bg: "bg-sky-500/15", text: "text-sky-400" },
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  rose: { bg: "bg-rose-500/15", text: "text-rose-400" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-400" },
} as const;

function ReviewRow({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
      <span className="flex-1 text-xs text-slate-300">{label}</span>
      <span className="px-2 py-0.5 rounded-md bg-[#0b1220] border border-white/5 text-xs font-bold tabular-nums">{value}</span>
    </div>
  );
}

function ReportRow({ label, severity, tone }: { label: string; severity: string; tone: "rose" | "amber" }) {
  const cls = tone === "rose" ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400";
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex-1 text-xs text-slate-300">{label}</span>
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${cls}`}>{severity}</span>
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
      return `${v} ${lng === "ar" ? ar : lng === "fr" ? fr : en}`;
    }
  }
  return new Date(iso).toLocaleDateString();
}

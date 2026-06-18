import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  Loader2, Download, AlertTriangle, RefreshCw, Filter as FilterIcon,
  TrendingDown, Droplet, Activity, Users, Stethoscope, Building2, CalendarClock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

export const Route = createFileRoute("/_authenticated/manage/analytics")({
  ssr: false,
  component: Analytics,
});

type Row = Record<string, string | number>;
type Period = "7" | "30" | "90" | "365";

const COLORS = [
  "hsl(199 89% 48%)", "hsl(142 71% 45%)", "hsl(346 87% 60%)",
  "hsl(38 92% 50%)", "hsl(262 83% 65%)", "hsl(174 72% 45%)",
  "hsl(24 95% 58%)", "hsl(217 91% 60%)",
];

function toCounts(rows: Array<{ k: string | number | null }>): Row[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = r.k == null ? "—" : String(r.k);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
}

function lastDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function downloadBlob(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  a.click(); URL.revokeObjectURL(url);
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Alert thresholds
const THRESH_REG_DROP_PCT = 30; // signups dropped 30% vs prev period
const THRESH_URGENT_BLOOD = 5;  // urgent/critical blood requests in period

function Analytics() {
  const { t, i18n } = useTranslation();
  const lng = (["ar", "fr", "en"].includes(i18n.language) ? i18n.language : "ar") as "ar" | "fr" | "en";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [period, setPeriod] = useState<Period>("30");
  const [wilayaId, setWilayaId] = useState<string>("all");
  const [specialtyId, setSpecialtyId] = useState<string>("all");

  // Lookups
  const [wilayas, setWilayas] = useState<Array<{ id: number; name: string }>>([]);
  const [specialties, setSpecialties] = useState<Array<{ id: number; name: string }>>([]);

  // Aggregates
  const [doctorsByWilaya, setDoctorsByWilaya] = useState<Row[]>([]);
  const [doctorsBySpecialty, setDoctorsBySpecialty] = useState<Row[]>([]);
  const [hospitalsByWilaya, setHospitalsByWilaya] = useState<Row[]>([]);
  const [bloodByType, setBloodByType] = useState<Row[]>([]);
  const [bloodByUrgency, setBloodByUrgency] = useState<Row[]>([]);
  const [appointmentsByStatus, setAppointmentsByStatus] = useState<Row[]>([]);
  const [registrations, setRegistrations] = useState<Row[]>([]);

  // KPIs
  const [kpi, setKpi] = useState({
    doctors: 0, hospitals: 0, users: 0, pending: 0,
    appointments: 0, urgentBlood: 0,
  });
  const [prevSignups, setPrevSignups] = useState(0);
  const [currSignups, setCurrSignups] = useState(0);

  // Data tables (queries section)
  const [tableTab, setTableTab] = useState<"doctors" | "hospitals" | "blood_requests" | "appointments">("doctors");
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [tableSearch, setTableSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, Set<string>>>({
    doctors: new Set(["id", "full_name", "phone", "wilaya_id", "specialty_id", "fee", "created_at"]),
    hospitals: new Set(["id", "name", "phone", "wilaya_id", "address", "created_at"]),
    blood_requests: new Set(["id", "blood_type", "urgency", "units_needed", "hospital_name", "wilaya_id", "status", "created_at"]),
    appointments: new Set(["id", "doctor_id", "user_id", "scheduled_at", "status", "created_at"]),
  });

  // Activity feed
  const [activity, setActivity] = useState<Array<{ kind: string; title: string; subtitle: string; at: string }>>([]);
  const [activitySearch, setActivitySearch] = useState("");

  const nameKey = (`name_${lng}`) as "name_ar" | "name_fr" | "name_en";

  const periodDays = Number(period);
  const sinceIso = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - periodDays); return d.toISOString();
  }, [periodDays]);
  const prevSinceIso = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - periodDays * 2); return d.toISOString();
  }, [periodDays]);

  // Loader
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);

    const filterWilaya = wilayaId !== "all" ? Number(wilayaId) : null;
    const filterSpec = specialtyId !== "all" ? Number(specialtyId) : null;

    const docQ = supabase.from("doctors").select("wilaya_id, specialty_id, created_at");
    const hospQ = supabase.from("hospitals").select("wilaya_id, created_at");
    const bloodQ = supabase.from("blood_requests").select("blood_type, urgency, status, wilaya_id, created_at").gte("created_at", sinceIso);
    const apptQ = supabase.from("appointments").select("status, doctor_id, created_at").gte("created_at", sinceIso);

    const newDocsQ = supabase.from("doctors").select("created_at, wilaya_id, specialty_id").gte("created_at", sinceIso);
    const newUsersQ = supabase.from("profiles").select("created_at, wilaya_id").gte("created_at", sinceIso);
    const newHospQ = supabase.from("hospitals").select("created_at, wilaya_id").gte("created_at", sinceIso);

    const prevDocsQ = supabase.from("doctors").select("id", { count: "exact", head: true }).gte("created_at", prevSinceIso).lt("created_at", sinceIso);
    const prevUsersQ = supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", prevSinceIso).lt("created_at", sinceIso);
    const prevHospQ = supabase.from("hospitals").select("id", { count: "exact", head: true }).gte("created_at", prevSinceIso).lt("created_at", sinceIso);

    if (filterWilaya != null) {
      [docQ, hospQ, bloodQ, newDocsQ, newUsersQ, newHospQ].forEach((q) => q.eq("wilaya_id", filterWilaya));
      prevDocsQ.eq("wilaya_id", filterWilaya);
      prevUsersQ.eq("wilaya_id", filterWilaya);
      prevHospQ.eq("wilaya_id", filterWilaya);
    }
    if (filterSpec != null) {
      docQ.eq("specialty_id", filterSpec);
      newDocsQ.eq("specialty_id", filterSpec);
      prevDocsQ.eq("specialty_id", filterSpec);
    }

    const [
      wList, sList, doctors, hospitals, blood, appts,
      newDocs, newUsers, newHosp,
      prevDocs, prevUsers, prevHosp,
      pendingCount, totalUsers,
    ] = await Promise.all([
      supabase.from("wilayas").select("id, name_ar, name_fr, name_en").order("id"),
      supabase.from("specialties").select("id, name_ar, name_fr, name_en").order(nameKey),
      docQ,
      hospQ,
      bloodQ,
      apptQ,
      newDocsQ,
      newUsersQ,
      newHospQ,
      prevDocsQ,
      prevUsersQ,
      prevHospQ,
      supabase.from("pending_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const wMap = new Map<number, string>();
    for (const w of wList.data ?? []) {
      wMap.set((w as any).id, (w as any)[nameKey] ?? (w as any).name_ar);
    }
    const sMap = new Map<number, string>();
    for (const s of sList.data ?? []) {
      sMap.set((s as any).id, (s as any)[nameKey] ?? (s as any).name_ar);
    }
    setWilayas((wList.data ?? []).map((w: any) => ({ id: w.id, name: w[nameKey] ?? w.name_ar })));
    setSpecialties((sList.data ?? []).map((s: any) => ({ id: s.id, name: s[nameKey] ?? s.name_ar })));

    const docW = toCounts((doctors.data ?? []).map((d: any) => ({ k: wMap.get(d.wilaya_id) ?? "—" })))
      .sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 10);
    const docS = toCounts((doctors.data ?? []).map((d: any) => ({ k: sMap.get(d.specialty_id) ?? "—" })))
      .sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 10);
    const hospW = toCounts((hospitals.data ?? []).map((h: any) => ({ k: wMap.get(h.wilaya_id) ?? "—" })))
      .sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 10);
    const bType = toCounts((blood.data ?? []).map((b: any) => ({ k: b.blood_type })));
    const bUrg = toCounts((blood.data ?? []).map((b: any) => ({ k: b.urgency })));
    const apptS = toCounts((appts.data ?? []).map((a: any) => ({ k: a.status })));

    const days = lastDays(periodDays);
    const bucket = (rows: any[] | null) => {
      const m = new Map<string, number>();
      for (const d of days) m.set(d, 0);
      for (const r of rows ?? []) {
        const k = String(r.created_at).slice(0, 10);
        if (m.has(k)) m.set(k, (m.get(k) ?? 0) + 1);
      }
      return m;
    };
    const dDoc = bucket(newDocs.data);
    const dUser = bucket(newUsers.data);
    const dHosp = bucket(newHosp.data);
    const trend = days.map((d) => ({
      name: d.slice(5),
      doctors: dDoc.get(d) ?? 0,
      users: dUser.get(d) ?? 0,
      hospitals: dHosp.get(d) ?? 0,
    }));

    const curr = (newDocs.data?.length ?? 0) + (newUsers.data?.length ?? 0) + (newHosp.data?.length ?? 0);
    const prev = (prevDocs.count ?? 0) + (prevUsers.count ?? 0) + (prevHosp.count ?? 0);
    const urgent = (blood.data ?? []).filter((b: any) => b.urgency === "urgent" || b.urgency === "critical").length;

    setDoctorsByWilaya(docW);
    setDoctorsBySpecialty(docS);
    setHospitalsByWilaya(hospW);
    setBloodByType(bType);
    setBloodByUrgency(bUrg);
    setAppointmentsByStatus(apptS);
    setRegistrations(trend);
    setKpi({
      doctors: doctors.data?.length ?? 0,
      hospitals: hospitals.data?.length ?? 0,
      users: totalUsers.count ?? 0,
      pending: pendingCount.count ?? 0,
      appointments: appts.data?.length ?? 0,
      urgentBlood: urgent,
    });
    setCurrSignups(curr);
    setPrevSignups(prev);
    setLoading(false);
    setRefreshing(false);
  }, [sinceIso, prevSinceIso, periodDays, wilayaId, specialtyId, nameKey]);

  // Initial + on-filter load
  useEffect(() => { load(false); }, [load]);

  // Realtime: debounced refresh on changes to key tables
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => load(true), 800);
    };
    const channel = supabase
      .channel("manage-analytics-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "hospitals" }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "blood_requests" }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, trigger)
      .subscribe();
    return () => { if (timer) clearTimeout(timer); supabase.removeChannel(channel); };
  }, [load]);

  // Alerts (computed)
  const alerts = useMemo(() => {
    const out: Array<{ severity: "warn" | "danger"; key: string; message: string }> = [];
    if (prevSignups >= 10) {
      const dropPct = ((prevSignups - currSignups) / prevSignups) * 100;
      if (dropPct >= THRESH_REG_DROP_PCT) {
        out.push({
          severity: "warn", key: "reg_drop",
          message: t("manage.analytics.alerts.regDrop", { pct: Math.round(dropPct), curr: currSignups, prev: prevSignups }),
        });
      }
    }
    if (kpi.urgentBlood >= THRESH_URGENT_BLOOD) {
      out.push({
        severity: "danger", key: "urgent_blood",
        message: t("manage.analytics.alerts.urgentBlood", { n: kpi.urgentBlood }),
      });
    }
    if (kpi.pending >= 20) {
      out.push({
        severity: "warn", key: "pending_high",
        message: t("manage.analytics.alerts.pendingHigh", { n: kpi.pending }),
      });
    }
    return out;
  }, [prevSignups, currSignups, kpi.urgentBlood, kpi.pending, t]);

  // Load data table rows
  const loadTable = useCallback(async () => {
    setTableLoading(true);
    const filterWilaya = wilayaId !== "all" ? Number(wilayaId) : null;
    const filterSpec = specialtyId !== "all" ? Number(specialtyId) : null;
    let q: any;
    if (tableTab === "doctors") {
      q = supabase.from("doctors").select("*").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(200);
      if (filterWilaya != null) q = q.eq("wilaya_id", filterWilaya);
      if (filterSpec != null) q = q.eq("specialty_id", filterSpec);
    } else if (tableTab === "hospitals") {
      q = supabase.from("hospitals").select("*").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(200);
      if (filterWilaya != null) q = q.eq("wilaya_id", filterWilaya);
    } else if (tableTab === "blood_requests") {
      q = supabase.from("blood_requests").select("*").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(200);
      if (filterWilaya != null) q = q.eq("wilaya_id", filterWilaya);
    } else {
      q = supabase.from("appointments").select("*").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(200);
    }
    const { data } = await q;
    setTableRows(data ?? []);
    setTableLoading(false);
  }, [tableTab, sinceIso, wilayaId, specialtyId]);

  useEffect(() => { loadTable(); }, [loadTable]);

  // Activity feed
  const loadActivity = useCallback(async () => {
    const [blood, appts, profiles] = await Promise.all([
      supabase.from("blood_requests").select("id, blood_type, urgency, hospital_name, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("appointments").select("id, doctor_id, status, scheduled_at, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }).limit(10),
    ]);
    const items: Array<{ kind: string; title: string; subtitle: string; at: string }> = [];
    for (const b of blood.data ?? []) {
      items.push({
        kind: "blood",
        title: `${t("manage.analytics.feed.blood")} • ${b.blood_type} (${b.urgency})`,
        subtitle: b.hospital_name ?? "—",
        at: b.created_at,
      });
    }
    for (const a of appts.data ?? []) {
      items.push({
        kind: "appointment",
        title: `${t("manage.analytics.feed.appointment")} • ${a.status}`,
        subtitle: a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : "",
        at: a.created_at,
      });
    }
    for (const p of profiles.data ?? []) {
      items.push({
        kind: "user",
        title: `${t("manage.analytics.feed.signup")} • ${p.full_name ?? "—"}`,
        subtitle: "",
        at: p.created_at,
      });
    }
    items.sort((a, b) => b.at.localeCompare(a.at));
    setActivity(items.slice(0, 30));
  }, [t]);

  useEffect(() => { loadActivity(); }, [loadActivity]);

  // Pull-to-refresh on activity panel
  const pullRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = pullRef.current;
    if (!el) return;
    let startY = 0; let pulling = false;
    const onStart = (e: TouchEvent) => {
      if (el.scrollTop === 0) { startY = e.touches[0].clientY; pulling = true; }
    };
    const onMove = (e: TouchEvent) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 70) { pulling = false; loadActivity(); }
    };
    const onEnd = () => { pulling = false; };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [loadActivity]);

  // CSV (charts)
  const csvCharts = useMemo(() => {
    const sections: Array<[string, Row[]]> = [
      ["doctors_by_wilaya", doctorsByWilaya],
      ["doctors_by_specialty", doctorsBySpecialty],
      ["hospitals_by_wilaya", hospitalsByWilaya],
      ["blood_by_type", bloodByType],
      ["blood_by_urgency", bloodByUrgency],
      ["appointments_by_status", appointmentsByStatus],
      ["registrations", registrations],
    ];
    return sections.map(([k, rows]) => {
      if (rows[0] && "doctors" in rows[0]) {
        return `# ${k}\nname,doctors,users,hospitals\n` +
          rows.map((r) => `${r.name},${r.doctors ?? 0},${r.users ?? 0},${r.hospitals ?? 0}`).join("\n");
      }
      return `# ${k}\nname,value\n` + rows.map((r) => `${csvEscape(r.name)},${r.value}`).join("\n");
    }).join("\n\n");
  }, [doctorsByWilaya, doctorsBySpecialty, hospitalsByWilaya, bloodByType, bloodByUrgency, appointmentsByStatus, registrations]);

  // CSV (table — selected columns only)
  const tableCsv = useMemo(() => {
    const cols = Array.from(visibleCols[tableTab]);
    const filtered = tableRows.filter((r) => {
      if (!tableSearch.trim()) return true;
      const hay = cols.map((c) => String(r[c] ?? "")).join(" ").toLowerCase();
      return hay.includes(tableSearch.toLowerCase());
    });
    const header = cols.join(",");
    const body = filtered.map((r) => cols.map((c) => csvEscape(r[c])).join(",")).join("\n");
    return `${header}\n${body}`;
  }, [tableRows, visibleCols, tableTab, tableSearch]);

  const allCols = useMemo(() => {
    if (tableRows.length === 0) return Array.from(visibleCols[tableTab]);
    const set = new Set<string>();
    for (const r of tableRows.slice(0, 50)) Object.keys(r).forEach((k) => set.add(k));
    return Array.from(set);
  }, [tableRows, tableTab, visibleCols]);

  const toggleCol = (col: string) => {
    setVisibleCols((prev) => {
      const next = { ...prev };
      const set = new Set(next[tableTab]);
      if (set.has(col)) set.delete(col); else set.add(col);
      next[tableTab] = set;
      return next;
    });
  };

  const filteredTableRows = useMemo(() => {
    const cols = Array.from(visibleCols[tableTab]);
    if (!tableSearch.trim()) return tableRows;
    return tableRows.filter((r) => {
      const hay = cols.map((c) => String(r[c] ?? "")).join(" ").toLowerCase();
      return hay.includes(tableSearch.toLowerCase());
    });
  }, [tableRows, visibleCols, tableTab, tableSearch]);

  const filteredActivity = useMemo(() => {
    if (!activitySearch.trim()) return activity;
    const q = activitySearch.toLowerCase();
    return activity.filter((a) => (a.title + " " + a.subtitle).toLowerCase().includes(q));
  }, [activity, activitySearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cols = Array.from(visibleCols[tableTab]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {t("manage.analytics.title")}
            {refreshing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("manage.analytics.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load(true)}>
            <RefreshCw className="h-4 w-4" /> {t("manage.analytics.refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadBlob(csvCharts, `analytics-${new Date().toISOString().slice(0, 10)}.csv`)}>
            <Download className="h-4 w-4" /> {t("manage.analytics.exportCsv")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FilterIcon className="h-4 w-4" />
          {t("manage.analytics.filters.title")}
        </div>
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground">{t("manage.analytics.filters.period")}</label>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t("manage.analytics.filters.d7")}</SelectItem>
              <SelectItem value="30">{t("manage.analytics.filters.d30")}</SelectItem>
              <SelectItem value="90">{t("manage.analytics.filters.d90")}</SelectItem>
              <SelectItem value="365">{t("manage.analytics.filters.d365")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground">{t("manage.analytics.filters.wilaya")}</label>
          <Select value={wilayaId} onValueChange={setWilayaId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">{t("manage.analytics.filters.all")}</SelectItem>
              {wilayas.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground">{t("manage.analytics.filters.specialty")}</label>
          <Select value={specialtyId} onValueChange={setSpecialtyId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">{t("manage.analytics.filters.all")}</SelectItem>
              {specialties.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {(wilayaId !== "all" || specialtyId !== "all" || period !== "30") && (
          <Button variant="ghost" size="sm" onClick={() => { setPeriod("30"); setWilayaId("all"); setSpecialtyId("all"); }}>
            {t("manage.analytics.filters.reset")}
          </Button>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.key}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                a.severity === "danger"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
              }`}
            >
              {a.severity === "danger" ? <Droplet className="h-5 w-5 mt-0.5" /> : <AlertTriangle className="h-5 w-5 mt-0.5" />}
              <div className="text-sm font-medium">{a.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi icon={<Stethoscope className="h-4 w-4" />} label={t("manage.kpi.doctors")} value={kpi.doctors} />
        <Kpi icon={<Building2 className="h-4 w-4" />} label={t("manage.kpi.hospitals")} value={kpi.hospitals} />
        <Kpi icon={<Users className="h-4 w-4" />} label={t("manage.kpi.users")} value={kpi.users} />
        <Kpi icon={<CalendarClock className="h-4 w-4" />} label={t("manage.analytics.kpi.appointments")} value={kpi.appointments} />
        <Kpi icon={<Droplet className="h-4 w-4" />} label={t("manage.analytics.kpi.urgentBlood")} value={kpi.urgentBlood} highlight={kpi.urgentBlood >= THRESH_URGENT_BLOOD} />
        <Kpi icon={<TrendingDown className="h-4 w-4" />} label={t("manage.analytics.kpi.signups")} value={currSignups} sub={`${prevSignups} ${t("manage.analytics.kpi.prev")}`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t("manage.analytics.registrations30")}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={registrations}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="users" stroke={COLORS[0]} strokeWidth={2} dot={false} name={t("manage.kpi.users")} />
              <Line type="monotone" dataKey="doctors" stroke={COLORS[1]} strokeWidth={2} dot={false} name={t("manage.kpi.doctors")} />
              <Line type="monotone" dataKey="hospitals" stroke={COLORS[2]} strokeWidth={2} dot={false} name={t("manage.kpi.hospitals")} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("manage.analytics.appointmentsByStatus")}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={appointmentsByStatus} dataKey="value" nameKey="name" outerRadius={90} label={{ fontSize: 11 }}>
                {appointmentsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("manage.analytics.doctorsByWilaya")}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={doctorsByWilaya} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="value" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("manage.analytics.doctorsBySpecialty")}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={doctorsBySpecialty} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="value" fill={COLORS[4]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("manage.analytics.hospitalsByWilaya")}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hospitalsByWilaya} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="value" fill={COLORS[5]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("manage.analytics.bloodByType")}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bloodByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="value" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("manage.analytics.bloodByUrgency")}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={bloodByUrgency} dataKey="value" nameKey="name" outerRadius={90} label={{ fontSize: 11 }}>
                {bloodByUrgency.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Customizable data table */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-semibold">{t("manage.analytics.table.title")}</h2>
          <div className="flex items-center gap-2">
            <Input
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder={t("manage.analytics.table.search")}
              className="h-8 w-48"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">{t("manage.analytics.table.columns")} ({cols.length})</Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 max-h-80 overflow-auto">
                <div className="space-y-1.5">
                  {allCols.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={visibleCols[tableTab].has(c)} onCheckedChange={() => toggleCol(c)} />
                      <span className="truncate">{c}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={() => downloadBlob(tableCsv, `${tableTab}-${new Date().toISOString().slice(0, 10)}.csv`)}>
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </div>
        <Tabs value={tableTab} onValueChange={(v) => setTableTab(v as any)}>
          <TabsList>
            <TabsTrigger value="doctors">{t("manage.kpi.doctors")}</TabsTrigger>
            <TabsTrigger value="hospitals">{t("manage.kpi.hospitals")}</TabsTrigger>
            <TabsTrigger value="blood_requests">{t("manage.analytics.table.blood")}</TabsTrigger>
            <TabsTrigger value="appointments">{t("manage.analytics.table.appointments")}</TabsTrigger>
          </TabsList>
          <TabsContent value={tableTab} className="mt-3">
            {tableLoading ? (
              <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="border rounded-lg overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {cols.map((c) => <TableHead key={c} className="whitespace-nowrap">{c}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTableRows.length === 0 ? (
                      <TableRow><TableCell colSpan={Math.max(cols.length, 1)} className="text-center text-muted-foreground py-6">{t("manage.crud.empty")}</TableCell></TableRow>
                    ) : filteredTableRows.map((r, i) => (
                      <TableRow key={r.id ?? i}>
                        {cols.map((c) => (
                          <TableCell key={c} className="whitespace-nowrap max-w-[260px] truncate text-xs">
                            {r[c] === null || r[c] === undefined ? "—" : typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {t("manage.analytics.table.shown", { n: filteredTableRows.length, total: tableRows.length })}
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Queries / activity feed */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" /> {t("manage.analytics.feed.title")}
          </h2>
          <div className="flex items-center gap-2">
            <Input
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              placeholder={t("manage.analytics.feed.search")}
              className="h-8 w-48"
            />
            <Button variant="outline" size="sm" onClick={loadActivity}>
              <RefreshCw className="h-4 w-4" /> {t("manage.analytics.refresh")}
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">{t("manage.analytics.feed.pullHint")}</p>
        <div ref={pullRef} className="max-h-[400px] overflow-auto space-y-2 pr-1">
          {filteredActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t("manage.crud.empty")}</p>
          ) : filteredActivity.map((a, i) => (
            <div key={i} className="flex items-start justify-between gap-2 p-2 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{a.kind}</Badge>
                  <span className="text-sm font-medium truncate">{a.title}</span>
                </div>
                {a.subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.subtitle}</p>}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {new Date(a.at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Kpi({ icon, label, value, sub, highlight }: { icon: React.ReactNode; label: string; value: number; sub?: string; highlight?: boolean }) {
  return (
    <div className={`bg-card border rounded-2xl p-3 ${highlight ? "border-destructive/50" : "border-border"}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={`text-2xl font-bold mt-1 ${highlight ? "text-destructive" : ""}`}>{value.toLocaleString()}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/manage/analytics")({
  ssr: false,
  component: Analytics,
});

type Row = Record<string, string | number>;

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

function Analytics() {
  const { t, i18n } = useTranslation();
  const lng = (["ar", "fr", "en"].includes(i18n.language) ? i18n.language : "ar") as "ar" | "fr" | "en";
  const [loading, setLoading] = useState(true);
  const [doctorsByWilaya, setDoctorsByWilaya] = useState<Row[]>([]);
  const [doctorsBySpecialty, setDoctorsBySpecialty] = useState<Row[]>([]);
  const [hospitalsByWilaya, setHospitalsByWilaya] = useState<Row[]>([]);
  const [bloodByType, setBloodByType] = useState<Row[]>([]);
  const [bloodByUrgency, setBloodByUrgency] = useState<Row[]>([]);
  const [appointmentsByStatus, setAppointmentsByStatus] = useState<Row[]>([]);
  const [registrations, setRegistrations] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceIso = since.toISOString();

      const [wilayas, specialties, doctors, hospitals, blood, appts, newDocs, newUsers, newHosp] =
        await Promise.all([
          supabase.from("wilayas").select("id, name_ar, name_fr, name_en"),
          supabase.from("specialties").select("id, name_ar, name_fr, name_en"),
          supabase.from("doctors").select("wilaya_id, specialty_id"),
          supabase.from("hospitals").select("wilaya_id"),
          supabase.from("blood_requests").select("blood_type, urgency, status, created_at"),
          supabase.from("appointments").select("status"),
          supabase.from("doctors").select("created_at").gte("created_at", sinceIso),
          supabase.from("profiles").select("created_at").gte("created_at", sinceIso),
          supabase.from("hospitals").select("created_at").gte("created_at", sinceIso),
        ]);
      if (cancelled) return;

      const wMap = new Map<number, string>();
      const wKey = (`name_${lng}`) as "name_ar" | "name_fr" | "name_en";
      for (const w of wilayas.data ?? []) {
        wMap.set((w as any).id, (w as any)[wKey] ?? (w as any).name_ar);
      }
      const sMap = new Map<number, string>();
      for (const s of specialties.data ?? []) {
        sMap.set((s as any).id, (s as any)[wKey] ?? (s as any).name_ar);
      }

      const docW = toCounts((doctors.data ?? []).map((d: any) => ({ k: wMap.get(d.wilaya_id) ?? "—" })))
        .sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 10);
      const docS = toCounts((doctors.data ?? []).map((d: any) => ({ k: sMap.get(d.specialty_id) ?? "—" })))
        .sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 10);
      const hospW = toCounts((hospitals.data ?? []).map((h: any) => ({ k: wMap.get(h.wilaya_id) ?? "—" })))
        .sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 10);
      const bType = toCounts((blood.data ?? []).map((b: any) => ({ k: b.blood_type })));
      const bUrg = toCounts((blood.data ?? []).map((b: any) => ({ k: b.urgency })));
      const apptS = toCounts((appts.data ?? []).map((a: any) => ({ k: a.status })));

      const days = lastDays(30);
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

      setDoctorsByWilaya(docW);
      setDoctorsBySpecialty(docS);
      setHospitalsByWilaya(hospW);
      setBloodByType(bType);
      setBloodByUrgency(bUrg);
      setAppointmentsByStatus(apptS);
      setRegistrations(trend);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [lng]);

  const csv = useMemo(() => {
    const sections: Array<[string, Row[]]> = [
      ["doctors_by_wilaya", doctorsByWilaya],
      ["doctors_by_specialty", doctorsBySpecialty],
      ["hospitals_by_wilaya", hospitalsByWilaya],
      ["blood_by_type", bloodByType],
      ["blood_by_urgency", bloodByUrgency],
      ["appointments_by_status", appointmentsByStatus],
      ["registrations_30d", registrations],
    ];
    return sections.map(([k, rows]) => {
      const head = `# ${k}\nname,value\n`;
      if (rows[0] && "doctors" in rows[0]) {
        return `# ${k}\nname,doctors,users,hospitals\n` +
          rows.map((r) => `${r.name},${r.doctors ?? 0},${r.users ?? 0},${r.hospitals ?? 0}`).join("\n");
      }
      return head + rows.map((r) => `${r.name},${r.value}`).join("\n");
    }).join("\n\n");
  }, [doctorsByWilaya, doctorsBySpecialty, hospitalsByWilaya, bloodByType, bloodByUrgency, appointmentsByStatus, registrations]);

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{t("manage.analytics.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("manage.analytics.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadCsv}>
          <Download className="h-4 w-4" />
          {t("manage.analytics.exportCsv")}
        </Button>
      </div>

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

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Droplet, AlertTriangle, Zap, Hospital, Phone, Hash, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/add-blood-request")({ component: Page });

const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"] as const;

const URGENCY_KEYS = [
  { key: "normal", icon: Droplet, color: "bg-blue-500", labelKey: "add-blood-request.urgencyNormal", descKey: "add-blood-request.urgencyNormalDesc" },
  { key: "urgent", icon: AlertTriangle, color: "bg-amber-500", labelKey: "add-blood-request.urgencyUrgent", descKey: "add-blood-request.urgencyUrgentDesc" },
  { key: "critical", icon: Zap, color: "bg-red-600", labelKey: "add-blood-request.urgencyCritical", descKey: "add-blood-request.urgencyCriticalDesc" },
] as const;

function Page() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({
    patient_name: "",
    blood_type: "O+" as (typeof BLOOD_TYPES)[number],
    units_needed: 1,
    urgency: "urgent" as (typeof URGENCY_KEYS)[number]["key"],
    hospital_name: "",
    contact_phone: "",
    notes: "",
    wilaya_id: null as number | null,
    baladiya_id: null as number | null,
  });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase.from("profiles")
        .select("phone,wilaya_id,baladiya_id,blood_type")
        .eq("user_id", u.user.id).maybeSingle();
      if (!p) return;
      setF((s) => ({
        ...s,
        contact_phone: s.contact_phone || (p.phone ?? ""),
        wilaya_id: s.wilaya_id ?? (p.wilaya_id as number | null),
        baladiya_id: s.baladiya_id ?? (p.baladiya_id as number | null),
      }));
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.contact_phone || !f.wilaya_id) {
      toast.error(t("add-blood-request.errorPhone"));
      return;
    }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSubmitting(false); toast.error(t("add-blood-request.errorLogin")); navigate({ to: "/auth" }); return; }
    const { error } = await supabase.from("blood_requests").insert({
      user_id: u.user.id,
      patient_name: f.patient_name || null,
      blood_type: f.blood_type as any,
      units_needed: f.units_needed,
      urgency: f.urgency as any,
      hospital_name: f.hospital_name || null,
      wilaya_id: f.wilaya_id,
      baladiya_id: f.baladiya_id,
      contact_phone: f.contact_phone,
      notes: f.notes || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("add-blood-request.successSend"));
    navigate({ to: "/donors" });
  };

  return (
    <FormShell title={t("add-blood-request.title")} onSubmit={submit} submitting={submitting}>
      <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2">
        <Zap className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
        <p className="text-xs text-foreground leading-relaxed">
          {t("add-blood-request.infoNote")}
        </p>
      </div>

      <div>
        <span className="mb-2 block text-xs text-muted-foreground">{t("add-blood-request.urgencyLabel")}</span>
        <div className="grid grid-cols-3 gap-2">
          {URGENCY_KEYS.map((u) => (
            <button
              key={u.key}
              type="button"
              onClick={() => setF({ ...f, urgency: u.key })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all active:scale-95",
                f.urgency === u.key
                  ? `${u.color} text-white border-transparent`
                  : "bg-card border-border text-foreground"
              )}
            >
              <u.icon className="w-4 h-4" />
              <span className="text-xs font-bold">{t(u.labelKey)}</span>
              <span className={cn("text-[9px]", f.urgency === u.key ? "opacity-90" : "text-muted-foreground")}>{t(u.descKey)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs text-muted-foreground flex items-center gap-1">
          <Droplet className="w-3.5 h-3.5 text-red-500" /> {t("add-blood-request.bloodTypeLabel")}
        </span>
        <div className="grid grid-cols-4 gap-2">
          {BLOOD_TYPES.map((bt) => (
            <button
              key={bt}
              type="button"
              onClick={() => setF({ ...f, blood_type: bt })}
              className={cn(
                "rounded-xl py-2.5 text-sm font-black transition-all active:scale-95",
                f.blood_type === bt
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-card border border-border text-foreground"
              )}
            >
              {bt}
            </button>
          ))}
        </div>
      </div>

      <Field label={t("add-blood-request.unitsLabel")}>
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <input
            type="number" min={1} max={20}
            className={inputCls}
            value={f.units_needed}
            onChange={(e) => setF({ ...f, units_needed: Math.max(1, Number(e.target.value) || 1) })}
          />
        </div>
      </Field>

      <Field label={t("add-blood-request.patientNameLabel")}>
        <input className={inputCls} value={f.patient_name} onChange={(e) => setF({ ...f, patient_name: e.target.value })} />
      </Field>

      <Field label={t("add-blood-request.hospitalLabel")}>
        <div className="relative">
          <Hospital className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground" />
          <input className={`${inputCls} pr-9`} value={f.hospital_name} onChange={(e) => setF({ ...f, hospital_name: e.target.value })} placeholder={t("add-blood-request.hospitalPlaceholder")} />
        </div>
      </Field>

      <CascadingLocation
        wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id}
        onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })}
      />

      <Field label={t("add-blood-request.phoneLabel")}>
        <div className="relative">
          <Phone className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground" />
          <input className={`${inputCls} pr-9`} value={f.contact_phone} onChange={(e) => setF({ ...f, contact_phone: e.target.value })} required />
        </div>
      </Field>

      <Field label={t("add-blood-request.notesLabel")}>
        <textarea
          rows={3}
          className={inputCls}
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
          placeholder={t("add-blood-request.notesPlaceholder")}
        />
      </Field>

      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Clock className="w-3 h-3" />
        {t("add-blood-request.durationNote")}
      </div>
    </FormShell>
  );
}

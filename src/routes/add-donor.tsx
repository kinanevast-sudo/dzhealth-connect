import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";

export const Route = createFileRoute("/add-donor")({ component: Page });

const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"] as const;

function Page() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({
    full_name: "", blood_type: "O+", phone: "", address: "",
    available: true, emergency: false,
    wilaya_id: null as number | null, baladiya_id: null as number | null,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.full_name || !f.phone || !f.wilaya_id) { toast.error(t("errorRequired")); return; }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("blood_donors").insert({
      full_name: f.full_name, blood_type: f.blood_type as any, phone: f.phone,
      address: f.address || null, available: f.available, emergency: f.emergency,
      wilaya_id: f.wilaya_id, baladiya_id: f.baladiya_id, created_by: u.user?.id ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("successRegister"));
    navigate({ to: "/donors" });
  };

  return (
    <FormShell title={t("title")} onSubmit={submit} submitting={submitting}>
      <Field label={t("fieldFullName")}><input className={inputCls} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required /></Field>
      <Field label={t("fieldBloodType")}>
        <select className={inputCls} value={f.blood_type} onChange={(e) => setF({ ...f, blood_type: e.target.value })}>
          {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
        </select>
      </Field>
      <CascadingLocation wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id} onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })} />
      <Field label={t("fieldPhone")}><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required /></Field>
      <Field label={t("fieldAddress")}><input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
      <div className="flex gap-4">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.available} onChange={(e) => setF({ ...f, available: e.target.checked })} className="h-4 w-4" /><span className="text-sm">{t("checkAvailable")}</span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.emergency} onChange={(e) => setF({ ...f, emergency: e.target.checked })} className="h-4 w-4" /><span className="text-sm">{t("checkEmergency")}</span></label>
      </div>
    </FormShell>
  );
}

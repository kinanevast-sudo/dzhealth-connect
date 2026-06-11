import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";

export const Route = createFileRoute("/add-hospital")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({
    name: "", kind: "عام", phone: "", address: "",
    wilaya_id: null as number | null, baladiya_id: null as number | null,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.wilaya_id) { toast.error("املأ الحقول الأساسية"); return; }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("hospitals").insert({
      name: f.name, kind: f.kind, phone: f.phone || null, address: f.address || null,
      wilaya_id: f.wilaya_id, baladiya_id: f.baladiya_id, created_by: u.user?.id ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة المستشفى");
    navigate({ to: "/hospitals" });
  };

  return (
    <FormShell title="إضافة مستشفى" onSubmit={submit} submitting={submitting}>
      <Field label="اسم المستشفى"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
      <Field label="النوع">
        <select className={inputCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
          <option value="عام">عام</option><option value="خاص">خاص</option><option value="عيادة">عيادة</option>
        </select>
      </Field>
      <CascadingLocation wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id} onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })} />
      <Field label="العنوان"><input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
      <Field label="الهاتف"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
    </FormShell>
  );
}

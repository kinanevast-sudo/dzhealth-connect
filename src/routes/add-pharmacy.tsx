import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";

export const Route = createFileRoute("/add-pharmacy")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({
    name: "", phone: "", address: "", is_24_7: false,
    wilaya_id: null as number | null, baladiya_id: null as number | null,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.wilaya_id) { toast.error("املأ الحقول الأساسية"); return; }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("pharmacies").insert({
      name: f.name, phone: f.phone || null, address: f.address || null, is_24_7: f.is_24_7,
      wilaya_id: f.wilaya_id, baladiya_id: f.baladiya_id, created_by: u.user?.id ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة الصيدلية");
    navigate({ to: "/pharmacies" });
  };

  return (
    <FormShell title="إضافة صيدلية" onSubmit={submit} submitting={submitting}>
      <Field label="اسم الصيدلية"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
      <CascadingLocation wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id} onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })} />
      <Field label="العنوان"><input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
      <Field label="الهاتف"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={f.is_24_7} onChange={(e) => setF({ ...f, is_24_7: e.target.checked })} className="h-4 w-4" />
        <span className="text-sm">مفتوحة 24/7</span>
      </label>
    </FormShell>
  );
}

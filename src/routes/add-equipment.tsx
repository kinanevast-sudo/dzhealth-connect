import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";

export const Route = createFileRoute("/add-equipment")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({
    name: "", kind: "كرسي متحرك", condition: "مستعمل", phone: "", available: true,
    wilaya_id: null as number | null, baladiya_id: null as number | null,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.wilaya_id) { toast.error("املأ الحقول الأساسية"); return; }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("equipment").insert({
      name: f.name, kind: f.kind, condition: f.condition, phone: f.phone || null,
      available: f.available, wilaya_id: f.wilaya_id, baladiya_id: f.baladiya_id,
      created_by: u.user?.id ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة المعدات");
    navigate({ to: "/equipment" });
  };

  return (
    <FormShell title="إضافة معدات طبية" onSubmit={submit} submitting={submitting}>
      <Field label="اسم المعدات"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="النوع">
          <select className={inputCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option>كرسي متحرك</option><option>سرير طبي</option><option>عكازات</option><option>جهاز قياس</option><option>أخرى</option>
          </select>
        </Field>
        <Field label="الحالة">
          <select className={inputCls} value={f.condition} onChange={(e) => setF({ ...f, condition: e.target.value })}>
            <option>جديد</option><option>مستعمل</option>
          </select>
        </Field>
      </div>
      <CascadingLocation wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id} onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })} />
      <Field label="الهاتف"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
    </FormShell>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";

export const Route = createFileRoute("/add-doctor")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [specs, setSpecs] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({
    full_name: "", specialty_id: "", phone: "", address: "",
    fee: "", experience_years: "", about: "",
    wilaya_id: null as number | null, baladiya_id: null as number | null,
  });

  useEffect(() => {
    supabase.from("specialties").select("id,name_ar").order("id").then(({ data }) => setSpecs(data ?? []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.full_name || !f.specialty_id || !f.wilaya_id) {
      toast.error("املأ الحقول الأساسية");
      return;
    }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("doctors").insert({
      full_name: f.full_name,
      specialty_id: Number(f.specialty_id),
      phone: f.phone || null,
      address: f.address || null,
      fee: f.fee ? Number(f.fee) : null,
      experience_years: f.experience_years ? Number(f.experience_years) : null,
      about: f.about || null,
      wilaya_id: f.wilaya_id,
      baladiya_id: f.baladiya_id,
      created_by: u.user?.id ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة الطبيب");
    navigate({ to: "/doctors" });
  };

  return (
    <FormShell title="إضافة طبيب" onSubmit={submit} submitting={submitting}>
      <Field label="الاسم الكامل"><input className={inputCls} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required /></Field>
      <Field label="التخصص">
        <select className={inputCls} value={f.specialty_id} onChange={(e) => setF({ ...f, specialty_id: e.target.value })} required>
          <option value="">اختر</option>
          {specs.map((s) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
        </select>
      </Field>
      <CascadingLocation wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id} onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })} />
      <Field label="العنوان"><input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="الهاتف"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="رسوم الكشف (دج)"><input type="number" className={inputCls} value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} /></Field>
      </div>
      <Field label="سنوات الخبرة"><input type="number" className={inputCls} value={f.experience_years} onChange={(e) => setF({ ...f, experience_years: e.target.value })} /></Field>
      <Field label="نبذة عن الطبيب"><textarea rows={3} className={inputCls} value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} /></Field>
    </FormShell>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Droplet, AlertTriangle, Zap, Hospital, Phone, Hash, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/add-blood-request")({ component: Page });

const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"] as const;

const URGENCY = [
  { key: "normal", label: "عادي", icon: Droplet, color: "bg-blue-500", desc: "خلال أيام" },
  { key: "urgent", label: "عاجل", icon: AlertTriangle, color: "bg-amber-500", desc: "خلال 24 ساعة" },
  { key: "critical", label: "حرج", icon: Zap, color: "bg-red-600", desc: "فوري — حالة حرجة" },
] as const;

function Page() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({
    patient_name: "",
    blood_type: "O+" as (typeof BLOOD_TYPES)[number],
    units_needed: 1,
    urgency: "urgent" as (typeof URGENCY)[number]["key"],
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
      toast.error("املأ رقم الهاتف والولاية");
      return;
    }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSubmitting(false); toast.error("سجّل الدخول أولاً"); navigate({ to: "/auth" }); return; }
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
    toast.success("تم إرسال الطلب وإشعار المتبرعين المتوافقين");
    navigate({ to: "/donors" });
  };

  return (
    <FormShell title="طلب دم عاجل" onSubmit={submit} submitting={submitting}>
      <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2">
        <Zap className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
        <p className="text-xs text-foreground leading-relaxed">
          سيتم إرسال إشعار للمتبرعين أصحاب الفصائل المتوافقة في نفس الولاية. الحالات الحرجة تصل لمستخدمي البلدية أيضاً.
        </p>
      </div>

      <div>
        <span className="mb-2 block text-xs text-muted-foreground">درجة الاستعجال</span>
        <div className="grid grid-cols-3 gap-2">
          {URGENCY.map((u) => (
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
              <span className="text-xs font-bold">{u.label}</span>
              <span className={cn("text-[9px]", f.urgency === u.key ? "opacity-90" : "text-muted-foreground")}>{u.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs text-muted-foreground flex items-center gap-1">
          <Droplet className="w-3.5 h-3.5 text-red-500" /> فصيلة الدم المطلوبة *
        </span>
        <div className="grid grid-cols-4 gap-2">
          {BLOOD_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setF({ ...f, blood_type: t })}
              className={cn(
                "rounded-xl py-2.5 text-sm font-black transition-all active:scale-95",
                f.blood_type === t
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-card border border-border text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Field label="عدد الوحدات">
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

      <Field label="اسم المريض (اختياري)">
        <input className={inputCls} value={f.patient_name} onChange={(e) => setF({ ...f, patient_name: e.target.value })} />
      </Field>

      <Field label="المستشفى / المركز الصحي">
        <div className="relative">
          <Hospital className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground" />
          <input className={`${inputCls} pr-9`} value={f.hospital_name} onChange={(e) => setF({ ...f, hospital_name: e.target.value })} placeholder="مثال: مستشفى مصطفى باشا" />
        </div>
      </Field>

      <CascadingLocation
        wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id}
        onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })}
      />

      <Field label="رقم الهاتف للتواصل *">
        <div className="relative">
          <Phone className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground" />
          <input className={`${inputCls} pr-9`} value={f.contact_phone} onChange={(e) => setF({ ...f, contact_phone: e.target.value })} required />
        </div>
      </Field>

      <Field label="ملاحظات">
        <textarea
          rows={3}
          className={inputCls}
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
          placeholder="معلومات إضافية تساعد المتبرعين..."
        />
      </Field>

      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Clock className="w-3 h-3" />
        ستظهر مدة الطلب 24 ساعة. يمكنك إغلاقه يدوياً عند الاستجابة.
      </div>
    </FormShell>
  );
}

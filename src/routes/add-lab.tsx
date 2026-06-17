import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";
import { ImageUploader } from "@/components/ImageUploader";
import { LocationPickerField } from "@/components/LocationPickerField";

export const Route = createFileRoute("/add-lab")({ component: Page, ssr: false });

function Page() {
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "", phone: "", address: "",
    wilaya_id: null as number | null, baladiya_id: null as number | null,
    lat: null as number | null, lng: null as number | null,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.phone) { toast.error("املأ الحقول الأساسية"); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("تم استلام المعلومات. سيتم تفعيل القسم قريباً");
    }, 600);
  };

  return (
    <FormShell title="إضافة مخبر تحاليل" onSubmit={submit} submitting={submitting}>
      <div className="flex items-center gap-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 p-3 text-sky-700 dark:text-sky-300">
        <FlaskConical className="h-5 w-5 flex-shrink-0" />
        <p className="text-xs">قسم المخابر قيد التطوير. يمكنك تسجيل المخبر الآن وسنضيفه عند الإطلاق.</p>
      </div>
      <ImageUploader value={photoUrl} onChange={setPhotoUrl} folder="labs" />
      <Field label="اسم المخبر *"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
      <Field label="رقم الهاتف *"><input dir="ltr" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0555 XX XX XX" required /></Field>
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <p className="text-sm font-semibold">الموقع</p>
        <CascadingLocation wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id} onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })} />
        <input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="العنوان التفصيلي" />
        <LocationPickerField lat={f.lat} lng={f.lng} onPicked={(loc) => setF((p) => ({ ...p, lat: loc.lat, lng: loc.lng, address: p.address || loc.address || "" }))} />
      </div>
    </FormShell>
  );
}

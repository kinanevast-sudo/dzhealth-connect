import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";
import { ImageUploader } from "@/components/ImageUploader";
import { LocationPickerField } from "@/components/LocationPickerField";

export const Route = createFileRoute("/add-hospital")({ component: Page, ssr: false });

function Page() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "", kind: "عام", phone: "", address: "",
    wilaya_id: null as number | null, baladiya_id: null as number | null,
    lat: null as number | null, lng: null as number | null,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.phone) { toast.error("املأ الحقول الأساسية"); return; }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("hospitals").insert({
      name: f.name, kind: f.kind, phone: f.phone || null, address: f.address || null,
      wilaya_id: f.wilaya_id, baladiya_id: f.baladiya_id,
      lat: f.lat, lng: f.lng, photo_url: photoUrl,
      created_by: u.user?.id ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة المستشفى");
    navigate({ to: "/hospitals" });
  };

  const kinds = ["عام", "خاص", "عيادة"];

  return (
    <FormShell title="إضافة مستشفى" onSubmit={submit} submitting={submitting}>
      <ImageUploader value={photoUrl} onChange={setPhotoUrl} folder="hospitals" />
      <Field label="اسم المستشفى *"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
      <Field label="رقم الهاتف *"><input dir="ltr" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0555 XX XX XX" required /></Field>
      <Field label="النوع">
        <div className="flex gap-2">
          {kinds.map((k) => (
            <button key={k} type="button" onClick={() => setF({ ...f, kind: k })}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${f.kind === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {k}
            </button>
          ))}
        </div>
      </Field>

      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <p className="text-sm font-semibold">الموقع</p>
        <CascadingLocation wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id} onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })} />
        <input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="العنوان التفصيلي" />
        <LocationPickerField
          lat={f.lat} lng={f.lng}
          onPicked={(loc) => setF((p) => ({ ...p, lat: loc.lat, lng: loc.lng, address: p.address || loc.address || "" }))}
        />
      </div>
    </FormShell>
  );
}

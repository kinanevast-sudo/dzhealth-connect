import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";
import { ImageUploader } from "@/components/ImageUploader";
import { LocationPickerField } from "@/components/LocationPickerField";

export const Route = createFileRoute("/add-doctor")({ component: Page, ssr: false });

function Page() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [specs, setSpecs] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [f, setF] = useState({
    full_name: "", specialty_id: "", phone: "", address: "",
    fee: "", experience_years: "", about: "",
    wilaya_id: null as number | null, baladiya_id: null as number | null,
    lat: null as number | null, lng: null as number | null,
  });

  useEffect(() => {
    supabase.from("specialties").select("id,name_ar").order("id").then(({ data }) => setSpecs(data ?? []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.full_name || !f.specialty_id || !f.phone) { toast.error(t("errorRequired")); return; }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("doctors").insert({
      full_name: f.full_name, specialty_id: Number(f.specialty_id),
      phone: f.phone || null, address: f.address || null,
      fee: f.fee ? Number(f.fee) : null,
      experience_years: f.experience_years ? Number(f.experience_years) : null,
      about: f.about || null, wilaya_id: f.wilaya_id, baladiya_id: f.baladiya_id,
      lat: f.lat, lng: f.lng, photo_url: photoUrl,
      created_by: u.user?.id ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("successAdd"));
    navigate({ to: "/doctors" });
  };

  return (
    <FormShell title={t("title")} onSubmit={submit} submitting={submitting}>
      <ImageUploader value={photoUrl} onChange={setPhotoUrl} folder="doctors" />
      <Field label={t("fieldFullName")}><input className={inputCls} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required /></Field>
      <Field label={t("fieldPhone")}><input dir="ltr" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0555 XX XX XX" required /></Field>
      <Field label={t("fieldSpecialty")}>
        <select className={inputCls} value={f.specialty_id} onChange={(e) => setF({ ...f, specialty_id: e.target.value })} required>
          <option value="">{t("specialtyPlaceholder")}</option>
          {specs.map((s) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("fieldFee")}><input type="number" className={inputCls} value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} placeholder="1500" /></Field>
        <Field label={t("fieldExperience")}><input type="number" className={inputCls} value={f.experience_years} onChange={(e) => setF({ ...f, experience_years: e.target.value })} /></Field>
      </div>
      <Field label={t("fieldAbout")}><textarea rows={3} className={inputCls} value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} /></Field>

      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <p className="text-sm font-semibold">{t("location")}</p>
        <CascadingLocation wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id} onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })} />
        <input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder={t("addressPlaceholder")} />
        <LocationPickerField
          lat={f.lat} lng={f.lng}
          onPicked={(loc) => setF((p) => ({ ...p, lat: loc.lat, lng: loc.lng, address: p.address || loc.address || "" }))}
        />
      </div>
    </FormShell>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";
import { ImageUploader } from "@/components/ImageUploader";
import { LocationPickerField } from "@/components/LocationPickerField";

export const Route = createFileRoute("/add-pharmacy")({ component: Page, ssr: false });

function Page() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "", phone: "", address: "", is_24_7: false,
    wilaya_id: null as number | null, baladiya_id: null as number | null,
    lat: null as number | null, lng: null as number | null,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.phone) { toast.error(t("errorRequired")); return; }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("pharmacies").insert({
      name: f.name, phone: f.phone || null, address: f.address || null, is_24_7: f.is_24_7,
      wilaya_id: f.wilaya_id, baladiya_id: f.baladiya_id,
      lat: f.lat, lng: f.lng, photo_url: photoUrl,
      created_by: u.user?.id ?? null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("successAdd"));
    navigate({ to: "/pharmacies" });
  };

  return (
    <FormShell title={t("title")} onSubmit={submit} submitting={submitting}>
      <ImageUploader value={photoUrl} onChange={setPhotoUrl} folder="pharmacies" />
      <Field label={t("fieldName")}><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
      <Field label={t("fieldPhone")}><input dir="ltr" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0555 XX XX XX" required /></Field>

      <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3">
        <div>
          <p className="font-semibold text-sm">{t("oncall24")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("oncall24Desc")}</p>
        </div>
        <button type="button" onClick={() => setF({ ...f, is_24_7: !f.is_24_7 })}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${f.is_24_7 ? "bg-green-500" : "bg-muted"}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${f.is_24_7 ? "end-0.5" : "start-0.5"}`} />
        </button>
      </div>

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

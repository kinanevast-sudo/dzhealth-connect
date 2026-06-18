import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";
import { ImageUploader } from "@/components/ImageUploader";
import { LocationPickerField } from "@/components/LocationPickerField";

export const Route = createFileRoute("/add-ambulance")({ component: Page, ssr: false });

function Page() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "", phone: "", is_24_7: true, address: "",
    wilaya_id: null as number | null, baladiya_id: null as number | null,
    lat: null as number | null, lng: null as number | null,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.phone) { toast.error(t("add-ambulance.errorRequired")); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase.from as any)("ambulances").insert({
      owner_id: user?.id ?? null, photo_url: photoUrl,
      name: f.name, phone: f.phone, is_24_7: f.is_24_7,
      coverage_area: f.address || null,
      wilaya_id: f.wilaya_id, baladiya_id: f.baladiya_id,
      lat: f.lat, lng: f.lng,
    });
    setSubmitting(false);
    if (error) { toast.error(t("add-ambulance.errorSave") + error.message); return; }
    toast.success(t("add-ambulance.successAdd"));
    navigate({ to: "/search" });
  };

  return (
    <FormShell title={t("add-ambulance.title")} onSubmit={submit} submitting={submitting}>
      <div className="flex items-center gap-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 p-3 text-orange-700 dark:text-orange-300">
        <Truck className="h-5 w-5 flex-shrink-0" />
        <p className="text-xs">{t("add-ambulance.infoNote")}</p>
      </div>
      <ImageUploader value={photoUrl} onChange={setPhotoUrl} folder="pharmacies" />
      <Field label={t("add-ambulance.fieldName")}><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
      <Field label={t("add-ambulance.fieldPhone")}><input dir="ltr" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0555 XX XX XX" required /></Field>

      <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3">
        <div>
          <p className="font-semibold text-sm">{t("add-ambulance.available24")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("add-ambulance.available24Desc")}</p>
        </div>
        <button type="button" onClick={() => setF({ ...f, is_24_7: !f.is_24_7 })}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${f.is_24_7 ? "bg-green-500" : "bg-muted"}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${f.is_24_7 ? "end-0.5" : "start-0.5"}`} />
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <p className="text-sm font-semibold">{t("add-ambulance.coverageArea")}</p>
        <CascadingLocation wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id} onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })} />
        <input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder={t("add-ambulance.addressPlaceholder")} />
        <LocationPickerField lat={f.lat} lng={f.lng} onPicked={(loc) => setF((p) => ({ ...p, lat: loc.lat, lng: loc.lng, address: p.address || loc.address || "" }))} />
      </div>
    </FormShell>
  );
}

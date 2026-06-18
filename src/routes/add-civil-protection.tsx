import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { CascadingLocation } from "@/components/CascadingLocation";
import { FormShell, Field, inputCls } from "@/components/FormShell";
import { ImageUploader } from "@/components/ImageUploader";
import { LocationPickerField } from "@/components/LocationPickerField";

export const Route = createFileRoute("/add-civil-protection")({ component: Page, ssr: false });

function Page() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "", phone: "", address: "",
    wilaya_id: null as number | null, baladiya_id: null as number | null,
    lat: null as number | null, lng: null as number | null,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.phone) { toast.error(t("errorRequired")); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase.from as any)("civil_protection_centers").insert({
      owner_id: user?.id ?? null, photo_url: photoUrl, ...f,
    });
    setSubmitting(false);
    if (error) { toast.error(t("errorSave") + error.message); return; }
    toast.success(t("successAdd"));
    navigate({ to: "/civil-protection" });
  };

  return (
    <FormShell title={t("title")} onSubmit={submit} submitting={submitting}>
      <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-red-700 dark:text-red-300">
        <Shield className="h-5 w-5 flex-shrink-0" />
        <p className="text-xs">{t("infoNote")}</p>
      </div>
      <ImageUploader value={photoUrl} onChange={setPhotoUrl} folder="pharmacies" />
      <Field label={t("fieldName")}><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
      <Field label={t("fieldPhone")}><input dir="ltr" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder={t("phonePlaceholder")} required /></Field>
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <p className="text-sm font-semibold">{t("location")}</p>
        <CascadingLocation wilayaId={f.wilaya_id} baladiyaId={f.baladiya_id} onChange={(w, b) => setF({ ...f, wilaya_id: w, baladiya_id: b })} />
        <input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder={t("addressPlaceholder")} />
        <LocationPickerField lat={f.lat} lng={f.lng} onPicked={(loc) => setF((p) => ({ ...p, lat: loc.lat, lng: loc.lng, address: p.address || loc.address || "" }))} />
      </div>
    </FormShell>
  );
}

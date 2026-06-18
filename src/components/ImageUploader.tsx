import { useRef, useState } from "react";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export function ImageUploader({
  value, onChange, folder,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: "doctors" | "hospitals" | "pharmacies";
}) {
  const { t } = useTranslation();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t("imageUploader.max_size_error")); return; }
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error(t("imageUploader.login_required")); setUploading(false); return; }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${u.user.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("places").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: signed } = await supabase.storage.from("places").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    setUploading(false);
    if (signed?.signedUrl) onChange(signed.signedUrl);
    else toast.error(t("imageUploader.image_url_error"));
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handle} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handle} />
      {value ? (
        <div className="relative">
          <img src={value} alt="preview" className="w-full h-44 object-cover" />
          <button type="button" onClick={() => onChange(null)} className="absolute top-2 end-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-sm font-semibold mb-3">{t("imageUploader.upload_title")}</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={uploading} onClick={() => cameraRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-secondary rounded-xl active:scale-95 transition-transform disabled:opacity-50">
              {uploading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : <Camera className="w-6 h-6 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground font-medium">{t("imageUploader.camera")}</span>
            </button>
            <button type="button" disabled={uploading} onClick={() => galleryRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-secondary rounded-xl active:scale-95 transition-transform disabled:opacity-50">
              {uploading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : <ImagePlus className="w-6 h-6 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground font-medium">{t("imageUploader.gallery")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "avatars";

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("الصورة يجب ألا تتعدى 5 ميغابايت");
  if (!file.type.startsWith("image/")) throw new Error("الملف يجب أن يكون صورة");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export async function getAvatarUrl(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(pathOrUrl, 60 * 60 * 24 * 7);
  if (error) return null;
  return data?.signedUrl ?? null;
}

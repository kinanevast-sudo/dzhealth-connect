import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { User as UserIcon, Phone, MapPin, Droplet, Pencil, Star, Stethoscope, Calendar, BadgeCheck, LogOut, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { uploadAvatar, getAvatarUrl } from "@/lib/storage";

export const Route = createFileRoute("/profile")({ component: Page });

const TABS = ["نبذة عن الحساب", "مواعيدي", "المفضلة"] as const;

function Page() {
  const [profile, setProfile] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", blood_type: "O+" });
  const [tab, setTab] = useState<(typeof TABS)[number]>("نبذة عن الحساب");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase.from("profiles").select("*,wilayas(name_ar)").eq("user_id", u.user.id).maybeSingle();
    setProfile(data);
    if (data) {
      setForm({ full_name: data.full_name ?? "", phone: data.phone ?? "", blood_type: (data as any).blood_type ?? "O+" });
      const url = await getAvatarUrl((data as any).avatar_url);
      setAvatarUrl(url);
    }
  };

  useEffect(() => { load(); }, []);


  const saveProfile = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, phone: form.phone, blood_type: form.blood_type as any,
    }).eq("user_id", u.user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم حفظ التعديلات");
    setEditing(false);
    load();
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("يجب تسجيل الدخول"); return; }
    setUploading(true);
    try {
      const path = await uploadAvatar(file, u.user.id);
      const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("user_id", u.user.id);
      if (error) throw error;
      toast.success("تم تحديث الصورة");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "تعذّر رفع الصورة");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };


  return (
    <AppShell>
      <div className="min-h-[100dvh]" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        {/* Header band */}
        <div className="relative h-24" style={{ background: "linear-gradient(135deg, #67e8f9, #22d3ee)" }} />

        <div className="-mt-12 px-4 pb-8">
          {/* Profile card */}
          <div className="rounded-3xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
            <div className="flex items-start justify-between">
              {/* Edit chip */}
              <button onClick={() => setEditing((s) => !s)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "#f0f9ff", color: "#0891b2" }}>
                <Pencil className="h-3 w-3" /> {editing ? "إلغاء" : "تعديل الملف الشخصي"}
              </button>
              {/* Avatar */}
              <div className="relative -mt-16">
                <button onClick={() => fileRef.current?.click()} className="relative block h-24 w-24 overflow-hidden rounded-2xl" style={{ background: "#e0f2fe", border: "4px solid var(--card)" }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserIcon className="h-12 w-12" style={{ color: "#0891b2" }} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/40 py-1 text-[10px] font-bold text-white">
                    {uploading ? "..." : <Camera className="h-3 w-3" />}
                  </div>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
              </div>
            </div>

            <div className="mt-4 text-right">
              <div className="flex items-center justify-end gap-2">
                <h1 className="text-xl font-extrabold">{profile?.full_name ?? "زائر"}</h1>
                <BadgeCheck className="h-5 w-5" style={{ color: "#22d3ee" }} />
              </div>
              <p className="text-sm text-muted-foreground">{profile?.email ?? "—"}</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <Stat icon={Calendar} value="1" label="مواعيدي" />
              <Stat icon={Stethoscope} value="12" label="الأطباء" />
              <Stat icon={Star} value="8" label="التقييمات" />
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex rounded-2xl p-1" style={{ background: "#f0f9ff" }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className="flex-1 rounded-xl py-2 text-xs font-bold transition"
                style={tab === t ? { background: "var(--card)", color: "#0891b2", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" } : { color: "#94a3b8" }}>
                {t}
              </button>
            ))}
          </div>

          {tab === "نبذة عن الحساب" && (
            <div className="mt-4 space-y-4">
              {/* Blood type card */}
              <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-extrabold" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    {profile?.blood_type ?? "+O"}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-muted-foreground">فصيلة الدم</p>
                    <p className="text-lg font-extrabold">{profile?.blood_type ?? "O+"}</p>
                    <p className="text-[11px] text-muted-foreground">فصيلة الدم</p>
                  </div>
                </div>
              </div>

              {/* Info card */}
              <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <InfoRow icon={Phone} label="رقم الهاتف" value={profile?.phone ?? "—"} />
                <Divider />
                <InfoRow icon={MapPin} label="الولاية" value={profile?.wilayas?.name_ar ?? "—"} />
                <Divider />
                <InfoRow icon={Droplet} label="فصيلة الدم" value={profile?.blood_type ?? "—"} />
              </div>

              {editing && (
                <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <input className="w-full rounded-xl px-3 py-3 text-sm text-right" placeholder="الاسم الكامل" style={{ background: "var(--input)" }} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  <input className="w-full rounded-xl px-3 py-3 text-sm text-right" placeholder="الهاتف" style={{ background: "var(--input)" }} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <select className="w-full rounded-xl px-3 py-3 text-sm text-right" style={{ background: "var(--input)" }} value={form.blood_type} onChange={(e) => setForm({ ...form, blood_type: e.target.value })}>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <button onClick={saveProfile} className="w-full rounded-xl py-3 text-sm font-bold text-white" style={{ background: "#0891b2" }}>حفظ</button>
                </div>
              )}

              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/auth"; }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold" style={{ background: "#fee2e2", color: "#dc2626" }}>
                <LogOut className="h-4 w-4" /> تسجيل الخروج
              </button>
            </div>
          )}

          {tab === "مواعيدي" && (
            <div className="mt-6 rounded-2xl p-8 text-center text-sm text-muted-foreground" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              لا توجد مواعيد بعد
            </div>
          )}
          {tab === "المفضلة" && (
            <div className="mt-6 rounded-2xl p-8 text-center text-sm text-muted-foreground" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              لم تقم بإضافة أي عنصر للمفضلة بعد
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, value, label }: any) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-xl font-extrabold" style={{ color: "#0891b2" }}>{value}</p>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <span>{label}</span>
        <Icon className="h-3 w-3" />
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#f0f9ff" }}>
        <Icon className="h-4 w-4" style={{ color: "#0891b2" }} />
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="my-1 h-px" style={{ background: "var(--border)" }} />;
}

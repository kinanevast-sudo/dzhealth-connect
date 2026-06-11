import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { User as UserIcon, Phone, MapPin, Droplet, Pencil, Star, Stethoscope, Calendar, BadgeCheck, LogOut, Camera, Check, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { uploadAvatar, getAvatarUrl } from "@/lib/storage";

export const Route = createFileRoute("/profile")({ component: Page });

const TABS = ["نبذة عن الحساب", "مواعيدي", "المفضلة"] as const;
const BLOOD_TYPES = ["A-", "A+", "O-", "O+", "AB-", "AB+", "B-", "B+"] as const;

function Page() {
  const [profile, setProfile] = useState<any>(null);
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", blood_type: "O+", wilaya_id: null as number | null });
  const [tab, setTab] = useState<(typeof TABS)[number]>("نبذة عن الحساب");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setAvatarLoading(false); return; }
      const [{ data }, { data: wls }] = await Promise.all([
        supabase.from("profiles").select("*,wilayas(id,name_ar)").eq("user_id", u.user.id).maybeSingle(),
        supabase.from("wilayas").select("id,name_ar").order("id"),
      ]);
      setProfile(data);
      setWilayas(wls ?? []);
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          blood_type: (data as any).blood_type ?? "O+",
          wilaya_id: (data as any).wilaya_id ?? null,
        });
        setAvatarError(false);
        try {
          const url = await getAvatarUrl((data as any).avatar_url);
          setAvatarUrl(url);
        } catch {
          setAvatarUrl(null);
          setAvatarError(true);
        }
      }
    } finally {
      setAvatarLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = () => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        blood_type: profile.blood_type ?? "O+",
        wilaya_id: profile.wilaya_id ?? null,
      });
    }
    setEditing(true);
  };

  const saveProfile = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      blood_type: form.blood_type as any,
      wilaya_id: form.wilaya_id,
    }).eq("user_id", u.user.id);
    setSaving(false);
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

  const wilayaName = profile?.wilayas?.name_ar ?? "—";
  const selectedWilaya = wilayas.find((w) => w.id === form.wilaya_id);

  return (
    <AppShell>
      <div className="min-h-[100dvh]" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <div className="relative h-24" style={{ background: "linear-gradient(135deg, #67e8f9, #22d3ee)" }} />

        <div className="-mt-12 px-4 pb-8">
          {/* Profile card */}
          <div className="rounded-3xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
            <div className="flex items-start justify-between">
              {/* Left: edit chip OR save/cancel */}
              {editing ? (
                <div className="flex items-center gap-2">
                  <button onClick={saveProfile} disabled={saving} aria-label="حفظ"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md transition active:scale-95 disabled:opacity-60"
                    style={{ background: "#22c55e" }}>
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </button>
                  <button onClick={() => setEditing(false)} aria-label="إلغاء"
                    className="flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
                    style={{ background: "#f1f5f9", color: "#64748b" }}>
                    <X className="h-5 w-5" strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button onClick={startEdit} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "#f0f9ff", color: "#0891b2" }}>
                  <Pencil className="h-3 w-3" /> تعديل الملف الشخصي
                </button>
              )}

              {/* Avatar */}
              <div className="relative -mt-16">
                <button onClick={() => fileRef.current?.click()} className="relative block h-24 w-24 overflow-hidden rounded-2xl" style={{ background: "#e0f2fe", border: "4px solid var(--card)" }}>
                  {avatarLoading ? (
                    <div className="h-full w-full animate-pulse" style={{ background: "#bae6fd" }} />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" onError={() => { setAvatarUrl(null); setAvatarError(true); }} />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
                      <UserIcon className="h-12 w-12" style={{ color: "#0891b2" }} strokeWidth={1.5} />
                      {avatarError && <span className="text-[9px] font-semibold" style={{ color: "#0891b2" }}>تعذّر التحميل</span>}
                    </div>
                  )}
                </button>
                {editing && (
                  <button onClick={() => fileRef.current?.click()} aria-label="تغيير الصورة"
                    className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md"
                    style={{ background: "#0891b2", border: "3px solid var(--card)" }}>
                    {uploading ? <span className="text-[10px] font-bold">...</span> : <Camera className="h-3.5 w-3.5" />}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
              </div>
            </div>

            {/* Name / Email or name input */}
            {editing ? (
              <div className="mt-4">
                <input
                  className="w-full rounded-2xl px-4 py-3 text-right text-base font-bold focus:outline-none focus:ring-2"
                  placeholder="الاسم الكامل"
                  style={{ background: "#e0f7fa", color: "#0f172a" }}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
            ) : (
              <div className="mt-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <h1 className="text-xl font-extrabold">{profile?.full_name ?? "زائر"}</h1>
                  <BadgeCheck className="h-5 w-5" style={{ color: "#22d3ee" }} />
                </div>
                <p className="text-sm text-muted-foreground">{profile?.email ?? "—"}</p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <Stat icon={Calendar} value="2" label="مواعيدي" />
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
              {/* Blood type */}
              {editing ? (
                <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="mb-3 text-right text-sm font-bold text-muted-foreground">فصيلة الدم</p>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_TYPES.map((bt) => {
                      const active = form.blood_type === bt;
                      return (
                        <button key={bt} onClick={() => setForm({ ...form, blood_type: bt })}
                          className="rounded-xl py-3 text-sm font-extrabold transition"
                          style={active
                            ? { background: "#fee2e2", color: "#dc2626", border: "2px solid #fca5a5" }
                            : { background: "#e0f7fa", color: "#0891b2", border: "2px solid transparent" }}>
                          {bt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="mb-2 text-right text-xs text-muted-foreground">فصيلة الدم</p>
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-extrabold" style={{ background: "#fee2e2", color: "#dc2626" }}>
                      {profile?.blood_type ?? "O+"}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold">{profile?.blood_type ?? "O+"}</p>
                      <p className="text-[11px] text-muted-foreground">فصيلة الدم</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info card */}
              {editing ? (
                <div className="rounded-2xl p-4 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div>
                    <label className="mb-1.5 block text-right text-xs text-muted-foreground">رقم الهاتف</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-right text-sm focus:outline-none focus:ring-2"
                      placeholder="0xxx xx xx xx"
                      style={{ background: "#e0f7fa", color: "#0f172a" }}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-right text-xs text-muted-foreground">الولاية</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-xl px-4 py-3 text-right text-sm focus:outline-none focus:ring-2"
                        style={{ background: "#e0f7fa", color: "#0f172a" }}
                        value={form.wilaya_id ?? ""}
                        onChange={(e) => setForm({ ...form, wilaya_id: e.target.value ? Number(e.target.value) : null })}
                      >
                        <option value="">اختر الولاية</option>
                        {wilayas.map((w) => (
                          <option key={w.id} value={w.id}>{w.id}. {w.name_ar}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#0891b2" }} />
                    </div>
                    {selectedWilaya && (
                      <p className="mt-1 text-right text-[11px] text-muted-foreground">{selectedWilaya.id}. {selectedWilaya.name_ar}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <InfoRow icon={Phone} label="رقم الهاتف" value={profile?.phone ?? "—"} />
                  <Divider />
                  <InfoRow icon={MapPin} label="الولاية" value={wilayaName} />
                  <Divider />
                  <InfoRow icon={Droplet} label="فصيلة الدم" value={profile?.blood_type ?? "—"} />
                </div>
              )}

              {!editing && (
                <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/auth"; }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold" style={{ background: "#fee2e2", color: "#dc2626" }}>
                  <LogOut className="h-4 w-4" /> تسجيل الخروج
                </button>
              )}
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

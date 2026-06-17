import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon, Phone, MapPin, Droplet, Pencil, Star, Stethoscope,
  Calendar, BadgeCheck, LogOut, Camera, Check, X, ChevronDown,
  Heart, Mail, Trash2, Clock, Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { uploadAvatar, getAvatarUrl } from "@/lib/storage";

export const Route = createFileRoute("/profile")({ component: Page });

type Tab = "info" | "appointments" | "favorites";
const TABS: { id: Tab; label: string }[] = [
  { id: "info", label: "نبذة عن الحساب" },
  { id: "appointments", label: "مواعيدي" },
  { id: "favorites", label: "المفضلة" },
];
const BLOOD_TYPES = ["A-", "A+", "O-", "O+", "AB-", "AB+", "B-", "B+"] as const;

function Page() {
  const qc = useQueryClient();
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", blood_type: "O+", wilaya_id: null as number | null });
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id,scheduled_at,visit_type,status,fee,doctor_id,doctors(id,full_name,photo_url,specialties(name_ar))")
        .eq("user_id", userId!)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id,doctor_id,created_at,doctors(id,full_name,photo_url,rating,specialties(name_ar),wilayas(name_ar))")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const cancelAppointment = async (apptId: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", apptId);
    if (error) { toast.error(error.message); return; }
    toast.success("تم إلغاء الموعد");
    qc.invalidateQueries({ queryKey: ["appointments", userId] });
  };

  const removeFavorite = async (favId: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", favId);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف من المفضلة");
    qc.invalidateQueries({ queryKey: ["favorites", userId] });
  };


  const load = async () => {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setAvatarLoading(false); return; }
      setUserId(u.user.id);
      const [{ data }, { data: wls }] = await Promise.all([
        supabase.from("profiles").select("*,wilayas(id,name_ar)").eq("user_id", u.user.id).maybeSingle(),
        supabase.from("wilayas").select("id,name_ar").order("id"),
      ]);
      setProfile(data ? { ...data, email: u.user.email } : { email: u.user.email });
      setWilayas(wls ?? []);
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          blood_type: (data as any).blood_type ?? "O+",
          wilaya_id: (data as any).wilaya_id ?? null,
        });
        try {
          const url = await getAvatarUrl((data as any).avatar_url);
          setAvatarUrl(url);
        } catch {
          setAvatarUrl(null);
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
      <div dir="rtl" className="min-h-[100dvh] bg-background text-foreground">
        {/* Hero */}
        <div className="relative h-52">
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          {/* Top nav — settings on the right (RTL start), edit on the left (RTL end) */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <Link
              to="/settings"
              className="w-10 h-10 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center cursor-pointer border border-border"
              aria-label="الإعدادات"
            >
              <SettingsIcon className="w-5 h-5 text-foreground" />
            </Link>
            {!editing ? (
              <button
                onClick={startEdit}
                className="h-10 px-4 bg-background/80 backdrop-blur-sm rounded-xl flex items-center gap-2 cursor-pointer border border-border"
              >
                <Pencil className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold">تعديل</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="w-10 h-10 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center cursor-pointer border border-border"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="h-10 px-4 bg-primary text-primary-foreground rounded-xl flex items-center gap-2 cursor-pointer font-bold disabled:opacity-60"
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                  <span className="text-xs">حفظ</span>
                </button>
              </div>
            )}
          </div>

          {/* Avatar + name overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
            <div className="relative">
              <button
                onClick={() => fileRef.current?.click()}
                className="relative block h-24 w-24 overflow-hidden rounded-2xl bg-surface border-4 border-background"
              >
                {avatarLoading ? (
                  <div className="h-full w-full animate-pulse bg-muted" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" onError={() => setAvatarUrl(null)} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserIcon className="h-12 w-12 text-primary" strokeWidth={1.5} />
                  </div>
                )}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                aria-label="تغيير الصورة"
                className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground border-2 border-background"
              >
                {uploading ? <span className="text-[10px] font-bold">...</span> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
            </div>

            <div className="flex-1 pb-1 text-right">
              <div className="flex items-center gap-2 justify-end">
                <h1 className="text-2xl font-black drop-shadow-lg">{profile?.full_name ?? "زائر"}</h1>
                <BadgeCheck className="w-5 h-5 text-primary fill-primary" />
              </div>
              <div className="flex items-center gap-1 justify-end mt-0.5">
                <span className="text-muted-foreground text-xs">{profile?.email ?? "—"}</span>
                <Mail className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats card */}
        <div className="mx-4 -mt-2 bg-card rounded-2xl border border-border p-4 grid grid-cols-3 gap-3 z-10 relative">
          {[
            { icon: Calendar, value: String(appointments.filter((a: any) => a.status !== "cancelled").length), label: "مواعيدي" },
            { icon: Heart, value: String(favorites.length), label: "المفضلة" },
            { icon: Star, value: "0", label: "التقييمات" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-black text-primary">{s.value}</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
          <a
            href={profile?.phone ? `tel:${profile.phone}` : undefined}
            className="flex items-center justify-center gap-2 bg-secondary rounded-xl py-2.5 cursor-pointer"
          >
            <Phone className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium">اتصال</span>
          </a>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/auth"; }}
            className="flex items-center justify-center gap-2 bg-destructive/15 text-destructive rounded-xl py-2.5 cursor-pointer font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>

        {/* Tabs */}
        <div className="mx-4 mt-4 flex bg-secondary rounded-2xl p-1 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                activeTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-4 pb-24 space-y-4"
          >
            {activeTab === "info" && (
              <>
                {/* Blood type */}
                <section className="bg-card rounded-2xl border border-border p-4">
                  <h2 className="font-bold text-sm text-muted-foreground mb-3 text-right">فصيلة الدم</h2>
                  {editing ? (
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_TYPES.map((bt) => {
                        const active = form.blood_type === bt;
                        return (
                          <button
                            key={bt}
                            onClick={() => setForm({ ...form, blood_type: bt })}
                            className={`rounded-xl py-3 text-sm font-extrabold transition border-2 ${
                              active
                                ? "bg-blood/20 text-blood border-blood/40"
                                : "bg-secondary text-muted-foreground border-transparent"
                            }`}
                          >
                            {bt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blood/15 text-blood text-base font-extrabold">
                        {profile?.blood_type ?? "O+"}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold">{profile?.blood_type ?? "O+"}</p>
                        <p className="text-[11px] text-muted-foreground">فصيلة الدم المسجلة</p>
                      </div>
                    </div>
                  )}
                </section>

                {/* Personal info */}
                <section className="bg-card rounded-2xl border border-border p-4">
                  <h2 className="font-bold text-sm text-muted-foreground mb-3 text-right">معلومات شخصية</h2>
                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-right text-xs text-muted-foreground">الاسم الكامل</label>
                        <input
                          className="w-full rounded-xl px-4 py-3 text-right text-sm bg-input border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="الاسم الكامل"
                          value={form.full_name}
                          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-right text-xs text-muted-foreground">رقم الهاتف</label>
                        <input
                          className="w-full rounded-xl px-4 py-3 text-right text-sm bg-input border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0xxx xx xx xx"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-right text-xs text-muted-foreground">الولاية</label>
                        <div className="relative">
                          <select
                            className="w-full appearance-none rounded-xl px-4 py-3 text-right text-sm bg-input border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                            value={form.wilaya_id ?? ""}
                            onChange={(e) => setForm({ ...form, wilaya_id: e.target.value ? Number(e.target.value) : null })}
                          >
                            <option value="">اختر الولاية</option>
                            {wilayas.map((w) => (
                              <option key={w.id} value={w.id}>{w.id}. {w.name_ar}</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                        </div>
                        {selectedWilaya && (
                          <p className="mt-1 text-right text-[11px] text-muted-foreground">
                            {selectedWilaya.id}. {selectedWilaya.name_ar}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <InfoRow icon={Phone} label="رقم الهاتف" value={profile?.phone ?? "—"} />
                      <Divider />
                      <InfoRow icon={MapPin} label="الولاية" value={wilayaName} />
                      <Divider />
                      <InfoRow icon={Droplet} label="فصيلة الدم" value={profile?.blood_type ?? "—"} />
                    </div>
                  )}
                </section>

              </>
            )}

            {activeTab === "appointments" && (
              appointments.length === 0 ? (
                <section className="bg-card rounded-2xl border border-border p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">لا توجد مواعيد بعد</p>
                </section>
              ) : (
                <div className="space-y-2.5">
                  {appointments.map((a: any) => {
                    const dt = new Date(a.scheduled_at);
                    const statusMap: Record<string, { label: string; cls: string }> = {
                      pending: { label: "قيد الانتظار", cls: "bg-amber-500/15 text-amber-600" },
                      confirmed: { label: "مؤكد", cls: "bg-green-500/15 text-green-600" },
                      completed: { label: "مكتمل", cls: "bg-primary/15 text-primary" },
                      cancelled: { label: "ملغي", cls: "bg-destructive/15 text-destructive" },
                    };
                    const st = statusMap[a.status] ?? statusMap.pending;
                    return (
                      <div key={a.id} className="bg-card rounded-2xl border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Stethoscope className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-right min-w-0 flex-1">
                              <Link to="/doctors/$id" params={{ id: a.doctor_id }} className="text-sm font-bold truncate block">
                                {a.doctors?.full_name ?? "—"}
                              </Link>
                              <p className="text-xs text-muted-foreground truncate">{a.doctors?.specialties?.name_ar ?? ""}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {dt.toLocaleDateString("ar-DZ")}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {dt.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}</span>
                          <span>{a.visit_type === "online" ? "عن بعد" : "في العيادة"}</span>
                        </div>
                        {a.status !== "cancelled" && a.status !== "completed" && (
                          <button onClick={() => cancelAppointment(a.id)} className="mt-3 w-full bg-destructive/10 text-destructive rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1">
                            <X className="w-3.5 h-3.5" /> إلغاء الموعد
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {activeTab === "favorites" && (
              favorites.length === 0 ? (
                <section className="bg-card rounded-2xl border border-border p-8 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">لم تقم بإضافة أي عنصر للمفضلة بعد</p>
                </section>
              ) : (
                <div className="space-y-2.5">
                  {favorites.map((f: any) => (
                    <div key={f.id} className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {f.doctors?.photo_url ? (
                          <img src={f.doctors.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Stethoscope className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <Link to="/doctors/$id" params={{ id: f.doctor_id }} className="text-sm font-bold block truncate">
                          {f.doctors?.full_name ?? "—"}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">{f.doctors?.specialties?.name_ar ?? ""}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground justify-end">
                          {f.doctors?.wilayas?.name_ar && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {f.doctors.wilayas.name_ar}</span>}
                          {f.doctors?.rating ? <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {Number(f.doctors.rating).toFixed(1)}</span> : null}
                        </div>
                      </div>
                      <button onClick={() => removeFavorite(f.id)} className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="text-right flex-1 ms-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border" />;
}

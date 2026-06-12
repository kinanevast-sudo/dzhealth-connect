import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Phone, Map as MapIcon, MapPin, BadgeCheck, Share2, Heart,
  Star, Clock, Calendar, CheckCircle2, ChevronRight, Send, Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/doctors/$id")({ component: Detail });

type Tab = "info" | "reviews" | "book";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00",
];

const DAY_NAMES_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function getNextDays(count: number) {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function detectGender(x: any): "male" | "female" {
  const g = (x?.gender || "").toString().toLowerCase();
  if (["f", "female", "أنثى", "انثى", "femme"].includes(g)) return "female";
  if (["m", "male", "ذكر", "homme"].includes(g)) return "male";
  const name = (x?.full_name || "").toString();
  if (/^د[\.ـ\s]*ة|دكتورة|الدكتورة/.test(name)) return "female";
  if (/(ة|اء)\s*$/.test(name.replace(/^د\.?\s*|دكتور(ة)?\s*/g, ""))) return "female";
  return "male";
}

function Detail() {
  const { id } = Route.useParams();
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [fav, setFav] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<"in_person" | "online">("in_person");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const days = getNextDays(10);

  const { data: d, isLoading, isError } = useQuery({
    queryKey: ["doctor", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors")
        .select("*,specialties(name_ar),wilayas(name_ar),baladiyas(name_ar)")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    retry: 1,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (id) setFav(localStorage.getItem(`fav-doctor-${id}`) === "1");
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Skeleton className="h-96 w-full max-w-md rounded-2xl" />
      </div>
    );
  }
  if (isError || !d) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 p-8 text-center bg-background">
        <Stethoscope className="h-12 w-12 text-primary" />
        <p className="text-sm text-muted-foreground">تعذّر تحميل بيانات الطبيب.</p>
        <Link to="/doctors" className="rounded-2xl px-5 py-2.5 text-sm font-bold bg-primary text-primary-foreground">رجوع</Link>
      </div>
    );
  }

  const x = d as any;
  const gender = detectGender(x);
  const showImg = x.photo_url && !imgError;
  const fee = Number(x.fee ?? 0);
  const platformFee = 200;
  const specialtyName = x.specialties?.name_ar ?? "";
  const wilayaName = x.wilayas?.name_ar ?? "";
  const baladiyaName = x.baladiyas?.name_ar ?? "";

  const toggleFav = () => {
    const v = !fav;
    setFav(v);
    localStorage.setItem(`fav-doctor-${id}`, v ? "1" : "0");
    toast.success(v ? "أضيف إلى المفضلة" : "حُذف من المفضلة");
  };

  const handleShare = async () => {
    const text = `${x.full_name}\n${specialtyName}\n${wilayaName} - ${baladiyaName}\n${x.phone ?? ""}`;
    try {
      if (navigator.share) await navigator.share({ title: x.full_name, text, url: window.location.href });
      else { await navigator.clipboard.writeText(text); toast.success("تم نسخ معلومات الطبيب"); }
    } catch {}
  };

  const formatDateAr = (dd: Date) => `${dd.getDate()} ${MONTH_NAMES_AR[dd.getMonth()]}`;

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime) return;
    setBookingConfirmed(true);
    toast.success("تم تأكيد الموعد");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-10">
      {/* Hero */}
      <div className="relative h-72">
        {showImg ? (
          <img src={x.photo_url} alt={x.full_name} onError={() => setImgError(true)} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: gender === "female" ? "linear-gradient(135deg,#fce7f3,#fbcfe8)" : "linear-gradient(135deg,#cffafe,#a5f3fc)" }}>
            <span className="text-8xl">{gender === "female" ? "👩‍⚕️" : "👨‍⚕️"}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        <div className="absolute top-6 left-4 right-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={handleShare} className="w-10 h-10 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={toggleFav} className="w-10 h-10 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Heart className={`w-5 h-5 transition-colors ${fav ? "text-red-500 fill-red-500" : "text-foreground"}`} />
            </motion.button>
          </div>
          <Link to="/doctors" className="w-10 h-10 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-foreground" />
          </Link>
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-right">
          <div className="flex items-center gap-2 justify-end">
            {x.verified && <BadgeCheck className="w-5 h-5 text-primary fill-primary" />}
            <h1 className="text-2xl font-black text-white drop-shadow-lg">{x.full_name}</h1>
          </div>
          <p className="text-primary font-semibold">{specialtyName}</p>
          <div className="flex items-center gap-1 mt-0.5 justify-end">
            <span className="text-white/70 text-sm">{baladiyaName} - {wilayaName}</span>
            <MapPin className="w-3 h-3 text-white/70" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 -mt-2 bg-card rounded-2xl border border-border p-4 grid grid-cols-3 gap-3 z-10 relative">
        {[
          { label: "الخبرة", value: `${x.experience_years ?? 12}`, unit: "سنوات" },
          { label: "المرضى", value: `+${(((x.patients_count ?? 2800)) / 1000).toFixed(1)}K`, unit: "" },
          { label: "نسبة الرضا", value: `${x.satisfaction ?? 98}%`, unit: "" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-xl font-black text-primary">
              {s.value}
              {s.unit && <span className="text-[10px] font-normal text-muted-foreground ms-1">{s.unit}</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
        <a href={`https://www.google.com/maps?q=${x.lat},${x.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 font-medium text-sm">
          <MapIcon className="w-4 h-4" /> عرض على الخريطة
        </a>
        <a href={`tel:${x.phone}`} className="flex items-center justify-center gap-2 bg-secondary rounded-xl py-2.5 font-medium text-sm">
          <Phone className="w-4 h-4 text-foreground" /> اتصال
        </a>
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-4 flex bg-secondary rounded-2xl p-1 gap-1">
        {(["info", "reviews", "book"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {tab === "info" ? "نبذة" : tab === "reviews" ? "التقييمات" : "احجز موعد"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="px-4 py-4 pb-10 space-y-4"
        >
          {activeTab === "info" && (
            <>
              <section className="bg-card rounded-2xl border border-border p-4 text-right">
                <h2 className="font-bold text-sm text-muted-foreground mb-2">نبذة عن الطبيب</h2>
                <p className="text-sm text-foreground leading-relaxed">{x.about ?? "أستاذ محاضر، متخصص في تشخيص وعلاج الأمراض ضمن مجال التخصص."}</p>
              </section>

              <section className="bg-card rounded-2xl border border-border p-4 text-right">
                <h2 className="font-bold text-sm text-muted-foreground mb-3">التخصص</h2>
                <div className="flex flex-wrap gap-2 justify-end">
                  {[specialtyName, "أمراض مزمنة", "كشف عام"].filter(Boolean).map((s: string) => (
                    <span key={s} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">{s}</span>
                  ))}
                </div>
              </section>

              <section className="bg-card rounded-2xl border border-border p-4 text-right">
                <h2 className="font-bold text-sm text-muted-foreground mb-3">الموقع</h2>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-medium">{x.address ?? `${baladiyaName}، ${wilayaName}`}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{baladiyaName}، {wilayaName}</p>
                    <a href={`https://www.google.com/maps?q=${x.lat},${x.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-xl">
                      <MapIcon className="w-3.5 h-3.5" /> عرض على الخريطة
                    </a>
                  </div>
                </div>
              </section>

              <section className="bg-card rounded-2xl border border-border p-4 text-right">
                <h2 className="font-bold text-sm text-muted-foreground mb-3">رسوم الاستشارة</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">رسوم الطبيب</span>
                    <span className="text-sm font-semibold">{fee} دج</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">رسوم المنصة</span>
                    <span className="text-sm font-semibold">{platformFee} دج</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-bold">الإجمالي</span>
                    <span className="font-black text-primary">{fee + platformFee} دج</span>
                  </div>
                </div>
              </section>

              <button onClick={() => setActiveTab("book")} className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" /> احجز موعد <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            </>
          )}

          {activeTab === "reviews" && <RatingsTab doctor={x} />}

          {activeTab === "book" && (
            bookingConfirmed ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10 gap-4 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </motion.div>
                <h2 className="text-xl font-black">تم تأكيد الموعد</h2>
                <div className="bg-card rounded-2xl border border-border p-4 w-full space-y-2 text-right">
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">الطبيب</span><span className="text-sm font-bold">{x.full_name}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">التاريخ</span><span className="text-sm font-bold">{selectedDate && formatDateAr(selectedDate)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">الوقت</span><span className="text-sm font-bold">{selectedTime}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-muted-foreground">نوع الزيارة</span><span className="text-sm font-bold">{visitType === "in_person" ? "في العيادة" : "عن بعد"}</span></div>
                </div>
                <button onClick={() => { setBookingConfirmed(false); setSelectedDate(null); setSelectedTime(null); }} className="w-full bg-secondary rounded-2xl py-3 font-bold text-sm">حجز موعد آخر</button>
              </motion.div>
            ) : (
              <>
                <section className="bg-card rounded-2xl border border-border p-4 text-right">
                  <h3 className="text-sm font-bold mb-3">نوع الزيارة</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(["in_person", "online"] as const).map((type) => (
                      <button key={type} onClick={() => setVisitType(type)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${visitType === type ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground bg-secondary"}`}>
                        <span>{type === "in_person" ? "🏥" : "💻"}</span>
                        {type === "in_person" ? "في العيادة" : "عن بعد"}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="bg-card rounded-2xl border border-border p-4 text-right">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 justify-end">
                    اختر التاريخ <Calendar className="w-4 h-4 text-primary" />
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {days.map((day) => {
                      const isSelected = selectedDate?.toDateString() === day.toDateString();
                      return (
                        <motion.button key={day.toISOString()} whileTap={{ scale: 0.95 }} onClick={() => setSelectedDate(day)}
                          className={`flex-shrink-0 flex flex-col items-center gap-1 w-14 py-3 rounded-xl border transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground"}`}>
                          <span className="text-[10px] font-medium">{DAY_NAMES_AR[day.getDay()]}</span>
                          <span className="text-lg font-black">{day.getDate()}</span>
                          <span className="text-[9px]">{MONTH_NAMES_AR[day.getMonth()].slice(0, 3)}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                <AnimatePresence>
                  {selectedDate && (
                    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-4 text-right">
                      <h3 className="text-sm font-bold mb-3 flex items-center gap-2 justify-end">
                        اختر الوقت <Clock className="w-4 h-4 text-primary" />
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {TIME_SLOTS.map((slot) => (
                          <motion.button key={slot} whileTap={{ scale: 0.95 }} onClick={() => setSelectedTime(slot)}
                            className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${selectedTime === slot ? "bg-primary border-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground"}`}>
                            {slot}
                          </motion.button>
                        ))}
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                <section className="bg-card rounded-2xl border border-border p-4 text-right">
                  <h3 className="text-sm font-bold mb-3">رسوم الاستشارة</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">رسوم الطبيب</span><span>{fee} دج</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">رسوم المنصة</span><span>{platformFee} دج</span></div>
                    <div className="border-t border-border pt-2 flex justify-between"><span className="font-bold">الإجمالي</span><span className="font-black text-primary">{fee + platformFee} دج</span></div>
                  </div>
                </section>

                <motion.button whileTap={{ scale: 0.98 }} onClick={handleConfirmBooking}
                  disabled={!selectedDate || !selectedTime}
                  className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${selectedDate && selectedTime ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"}`}>
                  <Calendar className="w-4 h-4" /> تأكيد الحجز
                </motion.button>
              </>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `منذ ${dd} يوم`;
  const w = Math.floor(dd / 7);
  if (w < 5) return `منذ ${w} أسبوع`;
  const mo = Math.floor(dd / 30);
  return `منذ ${mo} شهر`;
}

function RatingsTab({ doctor }: { doctor: any }) {
  const qc = useQueryClient();
  const [stars, setStars] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, []);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["doctor-reviews", doctor.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews" as any)
        .select("id,rating,review_text,created_at,user_id")
        .eq("doctor_id", doctor.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const profilesMap: Record<string, any> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles_public" as any).select("user_id,full_name,avatar_url").in("user_id", ids);
        (profs ?? []).forEach((p: any) => { profilesMap[p.user_id] = p; });
      }
      return rows.map((r: any) => ({ ...r, stars: r.rating, comment: r.review_text, profile: profilesMap[r.user_id] }));
    },
  });

  const total = reviews.length;
  const avg = reviews.length
    ? (reviews.reduce((a: number, r: any) => a + r.stars, 0) / reviews.length).toFixed(1)
    : (doctor.rating ?? 0).toFixed(1);
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r: any) => { dist[r.stars] = (dist[r.stars] || 0) + 1; });

  const submit = async () => {
    if (!userId) { toast.error("يجب تسجيل الدخول لإرسال تقييم"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews" as any).upsert({
      doctor_id: doctor.id, user_id: userId, rating: stars, review_text: comment.trim() || null,
    }, { onConflict: "doctor_id,user_id" });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("شكراً لتقييمك");
    setComment(""); setStars(5);
    qc.invalidateQueries({ queryKey: ["doctor-reviews", doctor.id] });
  };

  return (
    <>
      <section className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-6" dir="ltr">
          <div className="text-center">
            <p className="text-5xl font-black text-primary">{avg}</p>
            <div className="flex gap-0.5 mt-1 justify-center">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avg)) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{total} تقييم</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5,4,3,2,1].map((star) => {
              const count = dist[star] ?? 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-3">{star}</span>
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.15, duration: 0.5 }} className="h-full bg-yellow-500 rounded-full" />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-end">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-card rounded-2xl border border-border p-4 text-right">
        <h3 className="mb-3 text-sm font-bold text-primary">أضف تقييمك</h3>
        <div className="mb-3 flex justify-end gap-1" dir="ltr">
          {[1,2,3,4,5].map((i) => (
            <button key={i} type="button" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setStars(i)} className="transition-transform hover:scale-110">
              <Star className={`h-8 w-8 ${i <= (hover || stars) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3} placeholder="شاركنا تجربتك مع الطبيب..." className="w-full rounded-xl p-3 text-sm text-right resize-none bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
        <button onClick={submit} disabled={submitting} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold bg-primary text-primary-foreground disabled:opacity-60">
          <Send className="h-4 w-4" /> {submitting ? "جارٍ الإرسال..." : "إرسال التقييم"}
        </button>
      </section>

      {isLoading && <div className="bg-card rounded-2xl border border-border p-6 text-center text-xs text-muted-foreground">جارٍ تحميل التقييمات...</div>}
      {!isLoading && reviews.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 text-center text-xs text-muted-foreground">لا توجد تقييمات بعد. كن أول من يقيّم!</div>
      )}

      {reviews.map((r: any, i: number) => {
        const name = r.profile?.full_name ?? "مستخدم";
        return (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between mb-2 flex-row-reverse">
              <div className="flex items-center gap-2 flex-row-reverse">
                <span className="text-2xl">👤</span>
                <div className="text-right">
                  <p className="text-sm font-bold">{name}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3 h-3 ${s <= r.stars ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                ))}
              </div>
            </div>
            {r.comment && <p className="text-sm text-muted-foreground leading-relaxed text-right">{r.comment}</p>}
          </motion.div>
        );
      })}
    </>
  );
}

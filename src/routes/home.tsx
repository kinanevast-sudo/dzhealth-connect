import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Bell, Search, MapPin, ChevronRight,
  Phone, Activity, Stethoscope, Building2, Pill, Droplet, Zap, Loader2,
  Accessibility, Leaf, Eye, Baby, Brain, Bone, Heart, Star, BadgeCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { sortByDistance } from "@/lib/geo";
import { nearestWilaya } from "@/lib/wilayas-coords";
import { BloodRequestsSlider } from "@/components/BloodRequestsSlider";
import { CivilProtectionSlider } from "@/components/CivilProtectionSlider";
import { OnCallPharmaciesSlider } from "@/components/OnCallPharmaciesSlider";
import { getAvatarUrl } from "@/lib/storage";

export const Route = createFileRoute("/home")({ component: Home });

const BLOOD_TYPE_COLORS: Record<string, string> = {
  "O+": "text-red-500", "O-": "text-red-600",
  "A+": "text-blue-500", "A-": "text-blue-600",
  "B+": "text-green-500", "B-": "text-green-600",
  "AB+": "text-purple-500", "AB-": "text-purple-600",
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function fmtKm(km?: number, t?: (k: string) => string) {
  if (km == null || !isFinite(km)) return null;
  const m = t ? t("home.unitMeter") : "م";
  const km_ = t ? t("home.unitKm") : "كم";
  return km < 1 ? `${Math.round(km * 1000)} ${m}` : `${km.toFixed(1)} ${km_}`;
}

function Home() {
  const { t } = useTranslation();
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<{ wilaya?: string; baladiya?: string }>({});
  const [locationLoading, setLocationLoading] = useState(true);
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const unreadCount = useUnreadNotifications();

  const STATS = [
    { icon: Stethoscope, label: t("home.stats.doctors"), value: "1,240+", color: "text-primary", bg: "bg-primary/10" },
    { icon: Building2, label: t("home.stats.hospitals"), value: "320+", color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Pill, label: t("home.stats.pharmacies"), value: "4,500+", color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Droplet, label: t("home.stats.donors"), value: "800+", color: "text-red-500", bg: "bg-red-500/10" },
  ];

  const SPECIALTIES = [
    { id: "donors", icon: "🩸", name: t("home.specialtyNames.donors"), to: "/donors" },
    { id: "pharmacies", icon: "💊", name: t("home.specialtyNames.pharmacies"), to: "/pharmacies" },
    { id: "hospitals", icon: "🏥", name: t("home.specialtyNames.hospitals"), to: "/hospitals" },
    { id: "civil", icon: "🛡️", name: t("home.specialtyNames.civil"), to: "/civil-protection" },
    { id: "labs", icon: "🧪", name: t("home.specialtyNames.labs"), to: "/search" },
    { id: "charities", icon: "🤝", name: t("home.specialtyNames.charities"), to: "/search" },
    { id: "ambulances", icon: "🚑", name: t("home.specialtyNames.ambulances"), to: "/search" },
    { id: "pediatrics", icon: "👶", name: t("home.specialtyNames.pediatrics"), to: "/doctors" },
    { id: "equipment", icon: "🦽", name: t("home.specialtyNames.equipment"), to: "/equipment" },
    { id: "alt", icon: "🌿", name: t("home.specialtyNames.alt"), to: "/search" },
    { id: "eye", icon: "👁️", name: t("home.specialtyNames.eye"), to: "/doctors" },
    { id: "dental", icon: "🦷", name: t("home.specialtyNames.dental"), to: "/doctors" },
    { id: "neuro", icon: "🧠", name: t("home.specialtyNames.neuro"), to: "/doctors" },
    { id: "bone", icon: "🦴", name: t("home.specialtyNames.bone"), to: "/doctors" },
    { id: "gyn", icon: "🌸", name: t("home.specialtyNames.gyn"), to: "/doctors" },
    { id: "cardio", icon: "❤️", name: t("home.specialtyNames.cardio"), to: "/doctors" },
  ];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      let profileLoc: { lat: number; lng: number } | null = null;
      let profileLabel: { wilaya?: string; baladiya?: string } = {};
      let profileWilayaId: number | null = null;
      if (u.user) {
        const { data: p } = await supabase.from("profiles")
          .select("full_name,avatar_url,lat,lng,wilaya_id,wilayas(name_ar),baladiyas(name_ar)")
          .eq("user_id", u.user.id).maybeSingle();
        if (p?.full_name) setDisplayName(String(p.full_name).split(" ")[0]);
        if (p?.avatar_url) {
          try { setAvatarUrl(await getAvatarUrl(p.avatar_url)); } catch { setAvatarUrl(null); }
        }
        if (p?.lat && p?.lng) profileLoc = { lat: p.lat, lng: p.lng };
        if ((p as any)?.wilaya_id) profileWilayaId = (p as any).wilaya_id;
        profileLabel = {
          wilaya: (p as any)?.wilayas?.name_ar,
          baladiya: (p as any)?.baladiyas?.name_ar,
        };
      }

      const useFallback = () => {
        if (cancelled) return;
        if (profileLoc) setOrigin(profileLoc);
        setLocationLabel(profileLabel);
        setWilayaId(profileWilayaId);
        setLocationLoading(false);
      };

      if (typeof navigator === "undefined" || !navigator.geolocation) {
        useFallback();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const lat = pos.coords.latitude, lng = pos.coords.longitude;
          setOrigin({ lat, lng });
          const nearest = nearestWilaya(lat, lng);
          setWilayaId(nearest.id);
          try {
            const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`);
            const j = await r.json();
            const wilaya = j.city || j.principalSubdivision || nearest.name_ar;
            const baladiya = j.locality && j.locality !== wilaya ? j.locality : profileLabel.baladiya;
            if (!cancelled) setLocationLabel({ wilaya, baladiya });
          } catch {
            if (!cancelled) setLocationLabel({ wilaya: nearest.name_ar, baladiya: profileLabel.baladiya });
          }
          if (!cancelled) setLocationLoading(false);
        },
        () => useFallback(),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
      );
    })();
    return () => { cancelled = true; };
  }, []);

  const { data: doctorsRaw } = useQuery({
    queryKey: ["featured-doctors"],
    queryFn: async () => {
      const { data } = await supabase.from("doctors")
        .select("id,full_name,rating,reviews_count,photo_url,fee,verified,phone,lat,lng,specialties(name_ar),wilayas(name_ar),baladiyas(name_ar)")
        .order("rating", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  const { data: hospitalsRaw } = useQuery({
    queryKey: ["nearby-hospitals"],
    queryFn: async () => {
      const { data } = await supabase.from("hospitals")
        .select("id,name,photo_url,phone,lat,lng,wilayas(name_ar),baladiyas(name_ar)").limit(20);
      return data ?? [];
    },
  });

  const { data: pharmaciesRaw } = useQuery({
    queryKey: ["nearby-pharmacies"],
    queryFn: async () => {
      const { data } = await supabase.from("pharmacies")
        .select("id,name,is_24_7,phone,lat,lng,wilayas(name_ar)").limit(20);
      return data ?? [];
    },
  });

  const doctors = sortByDistance((doctorsRaw ?? []) as any[], origin);
  const featured = doctors.filter((d: any) => d.verified).slice(0, 3);
  const nearbyDoctors = doctors.slice(0, 8);
  const hospitals = sortByDistance((hospitalsRaw ?? []) as any[], origin).slice(0, 2);
  const pharmacies = sortByDistance((pharmaciesRaw ?? []) as any[], origin).slice(0, 3);

  const isLoading = !doctorsRaw;
  const visibleSpecialties = showAllSpecialties ? SPECIALTIES : SPECIALTIES.slice(0, 8);

  return (
    <AppShell>
      <div dir="rtl" className="min-h-[100dvh] bg-background">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const }}
          className="bg-card border-b border-border px-4 pt-12 pb-4"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" onError={() => setAvatarUrl(null)} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30" />
                ) : (
                  <motion.span
                    initial={{ rotate: -20, scale: 0.7 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 12 }}
                    className="text-2xl"
                  >👋</motion.span>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    {displayName ? t("home.greetingName", { name: displayName }) : t("home.greeting")}
                  </p>
                  <h1 className="text-lg font-black text-foreground">{t("home.howCanWeHelp")}</h1>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-primary" />
                {locationLoading ? (
                  <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {locationLabel.baladiya && locationLabel.wilaya
                      ? `${locationLabel.baladiya}، ${locationLabel.wilaya}`
                      : locationLabel.wilaya ?? locationLabel.baladiya ?? t("home.defaultLocation")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/notifications" className="relative w-10 h-10 bg-secondary rounded-xl flex items-center justify-center cursor-pointer">
                <Bell className="w-5 h-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          <Link to="/search">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3 cursor-pointer"
            >
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{t("home.searchPlaceholder")}</span>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-4 py-4 space-y-6">
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-4 gap-2">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1 bg-card rounded-xl border border-border p-2.5">
                  <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className={`text-xs font-black ${stat.color}`}>{stat.value}</span>
                  <span className="text-[9px] text-muted-foreground text-center leading-tight">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-base text-foreground">{t("home.specialties")}</h2>
              <button
                onClick={() => setShowAllSpecialties(!showAllSpecialties)}
                className="flex items-center gap-1 text-primary text-xs font-medium cursor-pointer"
              >
                {showAllSpecialties ? t("home.showLess") : t("home.showAll")}
                <motion.div animate={{ rotate: showAllSpecialties ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3 h-3" />
                </motion.div>
              </button>
            </div>

            <AnimatePresence>
              <motion.div layout className="grid grid-cols-4 gap-3">
                {visibleSpecialties.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                  >
                    <Link to={s.to}>
                      <motion.div
                        whileTap={{ scale: 0.93 }}
                        className="flex flex-col items-center gap-1.5 p-2 bg-card rounded-2xl border border-border hover:border-primary/50 transition-colors cursor-pointer active:bg-primary/5"
                      >
                        <span className="text-2xl">{s.icon}</span>
                        <span className="text-[10px] text-center text-foreground font-medium leading-tight line-clamp-2">
                          {s.name}
                        </span>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.section>

          <motion.div variants={itemVariants}>
            <BloodRequestsSlider wilayaId={wilayaId} />
          </motion.div>

          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-base text-foreground">{t("home.featuredDoctors")}</h2>
              <Link to="/doctors" className="flex items-center gap-1 text-primary text-xs font-medium">
                {t("home.showAll")} <ChevronRight className="w-3 h-3 rotate-180" />
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-28 w-full rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {featured.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.35 }}
                  >
                    <DoctorRow d={doc} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-base text-foreground">{t("home.nearbyDoctors")}</h2>
              <Link to="/nearby-doctors" className="flex items-center gap-1 text-primary text-xs font-medium">
                {t("home.showAll")} <ChevronRight className="w-3 h-3 rotate-180" />
              </Link>
            </div>
            <div className="-mx-4 px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <div className="flex gap-3 pb-1" style={{ width: "max-content" }}>
                {nearbyDoctors.map((doc: any, i: number) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                  >
                    <DoctorNearbyCard d={doc} />
                  </motion.div>
                ))}
                {nearbyDoctors.length === 0 && !isLoading && (
                  <div className="text-xs text-muted-foreground py-8 px-4">{t("home.noDoctorsNearby")}</div>
                )}
              </div>
            </div>
          </motion.section>

          <motion.div variants={itemVariants}>
            <CivilProtectionSlider wilayaName={locationLabel.wilaya} />
          </motion.div>

          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-base text-foreground">{t("home.nearbyHospitals")}</h2>
              <Link to="/hospitals" className="flex items-center gap-1 text-primary text-xs font-medium">{t("home.showAll")}</Link>
            </div>
            <div className="space-y-3">
              {hospitals.map((h: any) => (
                <motion.div key={h.id} whileTap={{ scale: 0.98 }} className="bg-card rounded-2xl border border-border overflow-hidden flex cursor-pointer">
                  {h.photo_url && <img src={h.photo_url} alt={h.name} className="w-24 h-24 object-cover flex-shrink-0" />}
                  <div className="p-3 flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{h.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {h.baladiyas?.name_ar ? `${h.baladiyas.name_ar} - ` : ""}{h.wilayas?.name_ar}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[t("home.hospitalTags.emergency"), t("home.hospitalTags.surgery"), t("home.hospitalTags.pediatrics")].map((s) => (
                        <span key={s} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{fmtKm(h._distanceKm, t) ?? h.wilayas?.name_ar}</span>
                      {h.phone && (
                        <a href={`tel:${h.phone}`} onClick={(e) => e.stopPropagation()} className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center cursor-pointer">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.div variants={itemVariants}>
            <OnCallPharmaciesSlider origin={origin} />
          </motion.div>

          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-base text-foreground">{t("home.nearbyPharmacies")}</h2>
              <Link to="/pharmacies" className="flex items-center gap-1 text-primary text-xs font-medium">{t("home.showAll")}</Link>
            </div>
            <div className="space-y-2">
              {pharmacies.map((p: any, i: number) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="flex items-center gap-3 bg-card rounded-xl border border-border p-3"
                >
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">💊</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground truncate">{p.name}</h3>
                      {p.is_24_7 && (
                        <span className="text-[9px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold">24/7</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.wilayas?.name_ar}
                      {fmtKm(p._distanceKm, t) && <span className="ms-2 font-bold text-primary">· {fmtKm(p._distanceKm, t)}</span>}
                    </p>
                  </div>
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 py-4 text-muted-foreground/40">
            <Activity className="w-4 h-4" />
            <span className="text-xs">DZHealth — {t("home.footer")}</span>
          </motion.div>
        </motion.div>
      </div>
    </AppShell>
  );
}

function DoctorRow({ d, showDistanceAsPrice = false }: { d: any; showDistanceAsPrice?: boolean }) {
  const { t } = useTranslation();
  const dist = fmtKm(d._distanceKm, t);
  return (
    <Link to="/doctors/$id" params={{ id: d.id }} className="block bg-card rounded-2xl border border-border p-3 active:scale-[0.98] transition">
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {d.photo_url ? (
            <img src={d.photo_url} alt={d.full_name} className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary text-2xl font-bold">د</div>
          )}
          {d.verified && (
            <div className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
              <BadgeCheck className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold leading-tight text-foreground">{d.full_name}</h3>
          <p className="mt-0.5 text-sm font-semibold text-primary">{d.specialties?.name_ar}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{d.wilayas?.name_ar}{d.baladiyas?.name_ar ? ` - ${d.baladiyas.name_ar}` : ""}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="font-bold">{d.rating}</span>
              <span className="text-muted-foreground">({d.reviews_count})</span>
            </div>
            {showDistanceAsPrice ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-black text-primary">
                <MapPin className="h-3 w-3" />
                {dist ?? "—"}
              </span>
            ) : (
              <span className="text-xs font-bold text-primary">{d.fee} {t("home.currency")}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function DoctorNearbyCard({ d }: { d: any }) {
  const { t } = useTranslation();
  const dist = fmtKm(d._distanceKm, t);
  return (
    <Link
      to="/doctors/$id"
      params={{ id: d.id }}
      className="block w-44 bg-card rounded-2xl border border-border p-3 active:scale-[0.98] transition"
    >
      <div className="relative">
        {d.photo_url ? (
          <img src={d.photo_url} alt={d.full_name} className="h-24 w-full rounded-xl object-cover" />
        ) : (
          <div className="flex h-24 w-full items-center justify-center rounded-xl bg-primary/10 text-primary text-3xl font-bold">د</div>
        )}
        {d.verified && (
          <div className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <BadgeCheck className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
      <h3 className="mt-2 text-sm font-extrabold leading-tight text-foreground truncate">{d.full_name}</h3>
      <p className="mt-0.5 text-xs font-semibold text-primary truncate">{d.specialties?.name_ar}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px]">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="font-bold">{d.rating}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-black text-primary">
          <MapPin className="h-3 w-3" />
          {dist ?? "—"}
        </span>
      </div>
    </Link>
  );
}

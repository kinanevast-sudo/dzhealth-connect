import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Phone, MapPin, Droplet, Zap, AlertTriangle, Clock, ChevronLeft, HeartHandshake } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { WILAYA_CAPITALS } from "@/lib/wilayas-coords";
import { haversineKm } from "@/lib/geo";

type Urgency = "critical" | "urgent" | "normal";

const URGENCY_META: Record<Urgency, { label: string; badge: string; ring: string; gradient: string; glow: string; icon: typeof Zap }> = {
  critical: {
    label: "حرج",
    badge: "bg-red-600 text-white",
    ring: "ring-red-500/50",
    gradient: "from-red-700/40 via-red-950/85 to-red-900/50 border-red-600/70",
    glow: "shadow-[0_8px_40px_-8px_rgba(220,38,38,0.55)]",
    icon: Zap,
  },
  urgent: {
    label: "عاجل",
    badge: "bg-orange-500 text-white",
    ring: "ring-orange-500/50",
    gradient: "from-orange-600/30 via-orange-950/80 to-orange-900/50 border-orange-600/70",
    glow: "shadow-[0_8px_40px_-8px_rgba(249,115,22,0.45)]",
    icon: AlertTriangle,
  },
  normal: {
    label: "عادي",
    badge: "bg-yellow-500 text-black",
    ring: "ring-yellow-500/50",
    gradient: "from-yellow-600/25 via-amber-950/70 to-yellow-900/40 border-yellow-600/70",
    glow: "shadow-[0_8px_40px_-8px_rgba(234,179,8,0.4)]",
    icon: Droplet,
  },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "الآن";
  const m = Math.floor(s / 60);
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  return `قبل ${Math.floor(h / 24)} ي`;
}

// Returns ids of nearby wilayas (including the given one) within ~150 km
function nearbyWilayaIds(wilayaId: number, radiusKm = 150): number[] {
  const origin = WILAYA_CAPITALS.find((w) => w.id === wilayaId);
  if (!origin) return [wilayaId];
  return WILAYA_CAPITALS
    .map((w) => ({ id: w.id, d: haversineKm({ lat: origin.lat, lng: origin.lng }, { lat: w.lat, lng: w.lng }) }))
    .filter((x) => x.d <= radiusKm)
    .sort((a, b) => a.d - b.d)
    .map((x) => x.id);
}

export function BloodRequestsSlider({ wilayaId, limit = 5, title = "طلبات دم في ولايتك" }: { wilayaId: number | null; limit?: number; title?: string }) {
  const wilayaIds = useMemo(() => (wilayaId ? nearbyWilayaIds(wilayaId) : null), [wilayaId]);

  const { data: requests = [] } = useQuery({
    queryKey: ["blood-requests-slider", wilayaId, limit, wilayaIds?.join(",")],
    queryFn: async () => {
      const baseSelect = "id,patient_name,blood_type,units_needed,urgency,hospital_name,contact_phone,notes,created_at,wilaya_id,wilayas(name_ar),baladiyas(name_ar)";
      if (wilayaIds && wilayaIds.length) {
        const { data } = await supabase
          .from("blood_requests")
          .select(baseSelect)
          .eq("status", "open")
          .in("wilaya_id", wilayaIds)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (data && data.length > 0) return data as any[];
      }
      const { data } = await supabase
        .from("blood_requests")
        .select(baseSelect)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(limit);
      return (data ?? []) as any[];
    },
  });

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (requests.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % requests.length), 4000);
    return () => clearInterval(t);
  }, [requests.length]);

  useEffect(() => { if (index >= requests.length) setIndex(0); }, [requests.length, index]);

  if (!requests.length) return null;
  const req = requests[index];
  const meta = URGENCY_META[(req.urgency as Urgency) ?? "urgent"];
  const Icon = meta.icon;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-black text-base text-foreground flex items-center gap-1.5">
          <Droplet className="w-4 h-4 text-red-500" />
          {title}
        </h2>
        <Link to="/donors" className="text-primary text-xs font-medium flex items-center gap-1">
          عرض الكل <ChevronLeft className="w-3 h-3" />
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={req.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn("relative bg-gradient-to-br border rounded-2xl px-4 pt-3 pb-4 ring-2", meta.gradient, meta.ring, meta.glow)}
          >
            {/* Top center plea */}
            <div className="flex flex-col items-center gap-1 mb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/90">
                <HeartHandshake className="w-3.5 h-3.5 text-red-300" />
                <span>أخوكم بحاجة إليكم</span>
                <HeartHandshake className="w-3.5 h-3.5 text-red-300 -scale-x-100" />
              </div>
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="text-base font-black text-red-400 leading-none tracking-tight"
                >
                  {req.blood_type}<span className="text-foreground/70 text-xs mx-0.5">×</span>{req.units_needed}
                </motion.span>
                <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1", meta.badge)}>
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-14 h-14 bg-red-600/25 border border-red-600/50 rounded-2xl flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-black text-red-300 leading-none">{req.blood_type}</span>
                  <span className="text-[9px] text-red-200/90 mt-0.5">×{req.units_needed}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-foreground truncate">
                    {req.patient_name || "مريض بحاجة عاجلة"}
                  </p>
                  {req.hospital_name && (
                    <p className="text-xs text-foreground/85 truncate">{req.hospital_name}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {req.baladiyas?.name_ar ? `${req.baladiyas.name_ar}، ` : ""}{req.wilayas?.name_ar ?? "—"}
                  </p>
                </div>
              </div>
              <a
                href={`tel:${req.contact_phone}`}
                className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform", meta.badge)}
                aria-label="اتصال"
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>

            <div className="absolute top-2 left-3 text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(req.created_at)}
            </div>
          </motion.div>
        </AnimatePresence>

        {requests.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {requests.map((_, i) => (
              <button
                key={i}
                aria-label={`اذهب للطلب ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-red-500" : "w-1.5 bg-muted-foreground/40"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

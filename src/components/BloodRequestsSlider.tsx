import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Phone, MapPin, Droplet, Zap, AlertTriangle, Clock, ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Urgency = "critical" | "urgent" | "normal";

const URGENCY_META: Record<Urgency, { label: string; badge: string; ring: string; gradient: string; icon: typeof Zap }> = {
  critical: {
    label: "حرج",
    badge: "bg-red-600 text-white",
    ring: "ring-red-500/40",
    gradient: "from-red-600/30 via-red-950/80 to-red-900/40 border-red-700/60",
    icon: Zap,
  },
  urgent: {
    label: "عاجل",
    badge: "bg-orange-500 text-white",
    ring: "ring-orange-500/40",
    gradient: "from-orange-600/25 via-orange-950/70 to-orange-900/40 border-orange-700/60",
    icon: AlertTriangle,
  },
  normal: {
    label: "عادي",
    badge: "bg-yellow-500 text-black",
    ring: "ring-yellow-500/40",
    gradient: "from-yellow-600/20 via-amber-950/60 to-yellow-900/30 border-yellow-700/60",
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

export function BloodRequestsSlider({ wilayaId }: { wilayaId: number | null }) {
  const { data: requests = [] } = useQuery({
    queryKey: ["blood-requests-slider", wilayaId],
    queryFn: async () => {
      const baseSelect = "id,patient_name,blood_type,units_needed,urgency,hospital_name,contact_phone,notes,created_at,wilaya_id,wilayas(name_ar),baladiyas(name_ar)";
      // 1) Try to fetch open requests in the user's wilaya first.
      if (wilayaId) {
        const { data } = await supabase
          .from("blood_requests")
          .select(baseSelect)
          .eq("status", "open")
          .eq("wilaya_id", wilayaId)
          .order("created_at", { ascending: false })
          .limit(10);
        if (data && data.length > 0) return data as any[];
      }
      // 2) Fallback: latest open requests anywhere (so the slider keeps showing).
      const { data } = await supabase
        .from("blood_requests")
        .select(baseSelect)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(10);
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
          طلبات دم في ولايتك
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
            className={cn("bg-gradient-to-br border rounded-2xl p-4 ring-2", meta.gradient, meta.ring)}
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className={cn("w-7 h-7 rounded-full flex items-center justify-center", meta.badge)}
              >
                <Icon className="w-3.5 h-3.5" />
              </motion.div>
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider", meta.badge)}>
                {meta.label}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 ms-auto">
                <Clock className="w-3 h-3" />
                {timeAgo(req.created_at)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 bg-red-600/20 border border-red-700/40 rounded-2xl flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-black text-red-400 leading-none">{req.blood_type}</span>
                  <span className="text-[8px] text-red-300 mt-0.5">×{req.units_needed}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {req.patient_name || "مريض بحاجة عاجلة"}
                  </p>
                  {req.hospital_name && (
                    <p className="text-xs text-foreground/80 truncate">{req.hospital_name}</p>
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

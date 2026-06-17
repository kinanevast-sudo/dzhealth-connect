import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MapPin, Shield, ChevronLeft, Flame } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import civilProtectionLogo from "@/assets/civil-protection.png.asset.json";

type Center = {
  id: string;
  name: string;
  phone: string;
  location: string;
  distance?: string;
  highlight?: string;
};

// Algerian Civil Protection emergency numbers + national reference
const DEFAULT_CENTERS: Center[] = [
  {
    id: "national",
    name: "الحماية المدنية — الرقم الأخضر",
    phone: "14",
    location: "الجزائر",
    distance: "متاح 24/7",
    highlight: "رقم وطني مجاني",
  },
  {
    id: "samu",
    name: "الإسعاف الطبي المستعجل (SAMU)",
    phone: "115",
    location: "كل الولايات",
    distance: "متاح 24/7",
    highlight: "حالات حرجة",
  },
  {
    id: "fire",
    name: "إطفاء الحرائق والإنقاذ",
    phone: "14",
    location: "تدخل سريع",
    distance: "متاح 24/7",
    highlight: "حرائق · حوادث · إنقاذ",
  },
];

export function CivilProtectionSlider({ wilayaName }: { wilayaName?: string }) {
  const [index, setIndex] = useState(0);
  const centers = DEFAULT_CENTERS.map((c, i) =>
    i === 0 && wilayaName ? { ...c, location: wilayaName } : c
  );

  useEffect(() => {
    if (centers.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % centers.length), 4500);
    return () => clearInterval(t);
  }, [centers.length]);

  const c = centers[index];

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-black text-base text-foreground flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-red-600" />
          الحماية المدنية قريبة منك
        </h2>
        <Link to="/search" className="text-primary text-xs font-medium flex items-center gap-1">
          عرض الكل <ChevronLeft className="w-3 h-3" />
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              "relative bg-gradient-to-br from-red-700/40 via-red-950/85 to-orange-900/50",
              "border border-red-600/70 rounded-2xl px-4 pt-3 pb-4 ring-2 ring-red-500/40",
              "shadow-[0_8px_40px_-8px_rgba(220,38,38,0.55)]"
            )}
          >
            {/* Header plea */}
            <div className="flex flex-col items-center gap-1 mb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/90">
                <Flame className="w-3.5 h-3.5 text-orange-300" />
                <span>في حالة الطوارئ — اتصل فوراً</span>
                <Flame className="w-3.5 h-3.5 text-orange-300" />
              </div>
              {c.highlight && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-600 text-white">
                  {c.highlight}
                </span>
              )}
            </div>

            {/* Body */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 p-1 border-2 border-red-600/60">
                  <img src={civilProtectionLogo.url} alt="الحماية المدنية" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {c.location}
                  </p>
                  <p className="text-[11px] text-red-200/90 mt-0.5">{c.distance}</p>
                </div>
              </div>
              <a
                href={`tel:${c.phone}`}
                className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-red-600 text-white shrink-0 active:scale-95 transition-transform"
                aria-label={`اتصال بـ ${c.phone}`}
              >
                <Phone className="w-4 h-4" />
                <span className="text-[11px] font-black mt-0.5">{c.phone}</span>
              </a>
            </div>
          </motion.div>
        </AnimatePresence>

        {centers.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {centers.map((_, i) => (
              <button
                key={i}
                aria-label={`اذهب للبطاقة ${i + 1}`}
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

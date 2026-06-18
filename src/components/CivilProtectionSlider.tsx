import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MapPin, Shield, ChevronLeft, Flame } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import civilProtectionLogo from "@/assets/civil-protection.png.asset.json";
import { useTranslation } from "react-i18next";

type Center = {
  id: string;
  name: string;
  phone: string;
  location: string;
  distance?: string;
  highlight?: string;
};

export function CivilProtectionSlider({ wilayaName }: { wilayaName?: string }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  const DEFAULT_CENTERS: Center[] = [
    {
      id: "national",
      name: t("civilProtectionSlider.national_name"),
      phone: "14",
      location: wilayaName ?? t("civilProtectionSlider.national_location"),
      distance: t("civilProtectionSlider.national_available"),
      highlight: t("civilProtectionSlider.national_highlight"),
    },
    {
      id: "samu",
      name: t("civilProtectionSlider.samu_name"),
      phone: "115",
      location: t("civilProtectionSlider.samu_location"),
      distance: t("civilProtectionSlider.national_available"),
      highlight: t("civilProtectionSlider.samu_highlight"),
    },
    {
      id: "fire",
      name: t("civilProtectionSlider.fire_name"),
      phone: "14",
      location: t("civilProtectionSlider.fire_location"),
      distance: t("civilProtectionSlider.national_available"),
      highlight: t("civilProtectionSlider.fire_highlight"),
    },
  ];

  const centers = DEFAULT_CENTERS;

  useEffect(() => {
    if (centers.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % centers.length), 4500);
    return () => clearInterval(timer);
  }, [centers.length]);

  const c = centers[index];

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-black text-base text-foreground flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-red-600" />
          {t("civilProtectionSlider.section_title")}
        </h2>
        <Link to="/civil-protection" className="text-primary text-xs font-medium flex items-center gap-1">
          {t("civilProtectionSlider.view_all")} <ChevronLeft className="w-3 h-3" />
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
            <div className="flex flex-col items-center gap-1 mb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/90">
                <Flame className="w-3.5 h-3.5 text-orange-300" />
                <span>{t("civilProtectionSlider.emergency_plea")}</span>
                <Flame className="w-3.5 h-3.5 text-orange-300" />
              </div>
              {c.highlight && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-600 text-white">
                  {c.highlight}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 p-1 border-2 border-red-600/60">
                  <img src={civilProtectionLogo.url} alt={t("civilProtectionSlider.civil_protection_alt")} className="w-full h-full object-contain" />
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
                aria-label={t("civilProtectionSlider.call_aria", { phone: c.phone })}
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
                aria-label={t("civilProtectionSlider.go_to_card", { n: i + 1 })}
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

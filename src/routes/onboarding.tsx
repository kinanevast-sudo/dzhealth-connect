import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, CalendarCheck, Droplet } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const SLIDE_META = [
  { icon: Stethoscope, color: "var(--primary)" },
  { icon: CalendarCheck, color: "var(--primary-glow)" },
  { icon: Droplet, color: "var(--blood)" },
];

function Onboarding() {
  const { t } = useTranslation();
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const last = i === SLIDE_META.length - 1;
  const S = SLIDE_META[i];
  const Icon = S.icon;

  return (
    <div className="relative flex min-h-[100dvh] flex-col px-6 pt-16 pb-10" style={{ background: "var(--gradient-hero)" }}>
      <button onClick={() => nav({ to: "/auth" })} className="absolute top-6 left-6 text-xs text-muted-foreground">{t("onboarding.skip")}</button>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}
          className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative flex h-44 w-44 items-center justify-center rounded-[2rem] glass animate-float" style={{ boxShadow: `0 0 60px ${S.color}55` }}>
            <Icon className="h-20 w-20" style={{ color: S.color }} strokeWidth={1.8} />
          </div>
          <h2 className="mt-10 text-2xl font-extrabold">{t(`onboarding.slide${i}_title`)}</h2>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{t(`onboarding.slide${i}_text`)}</p>
        </motion.div>
      </AnimatePresence>

      <div className="my-6 flex justify-center gap-2">
        {SLIDE_META.map((_, idx) => (
          <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-1.5 bg-muted"}`} />
        ))}
      </div>

      <button onClick={() => last ? nav({ to: "/auth" }) : setI(i + 1)}
        className="rounded-full gradient-primary py-4 text-sm font-bold text-primary-foreground neon-glow active:scale-[0.98] transition-transform">
        {last ? t("onboarding.start") : t("onboarding.next")}
      </button>
    </div>
  );
}

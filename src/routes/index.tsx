import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({ component: Splash });

function Splash() {
  const { t } = useTranslation();
  useEffect(() => {
    const timer = setTimeout(() => { window.location.href = "/onboarding"; }, 2400);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "radial-gradient(60% 40% at 50% 35%, color-mix(in oklab, var(--primary) 25%, transparent), transparent 70%)" }} />
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 140, damping: 14 }}
        className="relative flex h-32 w-32 items-center justify-center rounded-3xl gradient-primary neon-glow animate-float">
        <HeartPulse className="h-16 w-16 text-primary-foreground" strokeWidth={2.4} />
      </motion.div>
      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
        className="mt-8 text-5xl font-extrabold tracking-tight text-gradient">DzHealth</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="mt-3 text-sm text-muted-foreground">{t("indexPage.tagline")}</motion.p>
      <div className="absolute bottom-16 h-1 w-40 overflow-hidden rounded-full bg-surface-2">
        <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 1.2 }} className="h-full w-1/2 gradient-primary" />
      </div>
      <Link to="/home" className="absolute bottom-6 text-xs text-muted-foreground/70">{t("indexPage.skip")}</Link>
    </div>
  );
}

import type { ReactNode } from "react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { useTranslation } from "react-i18next";

export function FormShell({ title, onSubmit, submitting, children }: {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <AppShell>
      <ScreenHeader title={title} />
      <form onSubmit={onSubmit} className="space-y-4 p-4 pb-32">
        {children}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl gradient-primary py-4 text-sm font-bold text-primary-foreground neon-glow disabled:opacity-60"
        >
          {submitting ? t("formShell.saving") : t("formShell.save")}
        </button>
      </form>
    </AppShell>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full rounded-xl bg-input px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40";

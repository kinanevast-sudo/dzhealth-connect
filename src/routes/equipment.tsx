import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Accessibility, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";

export const Route = createFileRoute("/equipment")({ component: Page });

function Page() {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ["equipment"], queryFn: async () => (await supabase.from("equipment").select("*,wilayas(name_ar),baladiyas(name_ar)")).data ?? [] });
  return (
    <AppShell>
      <div style={{ background: "linear-gradient(180deg, oklch(0.24 0.06 155) 0%, var(--background) 60%)" }}>
        <ScreenHeader title={t("equipment.title")} />
      </div>
      <div className="space-y-3 px-4 pt-3">
        {(data ?? []).map((e: any) => (
          <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-surface card-elevated p-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-success"><Accessibility className="h-7 w-7 text-success-foreground" /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{e.name}</p>
              <p className="text-[11px] text-muted-foreground">{e.wilayas?.name_ar} - {e.condition}</p>
              {e.available && <span className="mt-1 inline-block text-[10px] font-bold text-success">{t("equipment.available")}</span>}
            </div>
            <a href={`tel:${e.phone}`} className="flex h-11 w-11 items-center justify-center rounded-full gradient-success text-success-foreground"><Phone className="h-4 w-4" /></a>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

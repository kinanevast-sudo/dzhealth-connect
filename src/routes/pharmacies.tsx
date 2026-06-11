import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pill, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";

export const Route = createFileRoute("/pharmacies")({ component: Page });

function Page() {
  const { data } = useQuery({ queryKey: ["pharmacies"], queryFn: async () => (await supabase.from("pharmacies").select("*,wilayas(name_ar),baladiyas(name_ar)")).data ?? [] });
  return (
    <AppShell>
      <ScreenHeader title="الصيدليات" />
      <div className="space-y-3 px-4 pt-3">
        {(data ?? []).map((p: any) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-surface card-elevated p-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "color-mix(in oklab, var(--success) 25%, transparent)" }}>
              <Pill className="h-7 w-7 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{p.name}</p>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.baladiyas?.name_ar}</span>
                {p.is_24_7 && <span className="rounded-full bg-success/20 px-2 py-0.5 text-success font-bold">24/7</span>}
              </div>
            </div>
            <a href={`tel:${p.phone}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-success text-success-foreground"><Phone className="h-4 w-4" /></a>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

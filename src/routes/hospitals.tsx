import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Phone, Star, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";

export const Route = createFileRoute("/hospitals")({ component: Page });

function Page() {
  const { data } = useQuery({ queryKey: ["hospitals"], queryFn: async () => (await supabase.from("hospitals").select("*,wilayas(name_ar),baladiyas(name_ar)")).data ?? [] });
  return (
    <AppShell>
      <ScreenHeader title="المستشفيات" />
      <div className="space-y-3 px-4 pt-3">
        {(data ?? []).map((h: any) => (
          <div key={h.id} className="flex items-center gap-3 rounded-2xl bg-surface card-elevated p-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground"><Building2 className="h-7 w-7" /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{h.name}</p>
              <p className="text-[11px] text-muted-foreground">{h.kind}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" />{h.rating}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.baladiyas?.name_ar}</span>
              </div>
            </div>
            <a href={`tel:${h.phone}`} className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-primary-foreground"><Phone className="h-4 w-4" /></a>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

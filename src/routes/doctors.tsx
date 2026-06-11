import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, Star, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";

export const Route = createFileRoute("/doctors")({ component: Doctors });

function Doctors() {
  const { data } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data } = await supabase.from("doctors").select("id,full_name,rating,fee,phone,wilaya_id,specialty_id,specialties(name_ar),wilayas(name_ar),baladiyas(name_ar)");
      return data ?? [];
    },
  });
  return (
    <AppShell>
      <ScreenHeader title="الأطباء" />
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-2 rounded-2xl bg-surface card-elevated px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="ابحث عن طبيب أو تخصص..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </div>
      <div className="space-y-3 px-4">
        {(data ?? []).map((d: any) => (
          <Link key={d.id} to="/doctors/$id" params={{ id: d.id }} className="flex items-center gap-3 rounded-2xl bg-surface card-elevated p-3 active:scale-[0.98] transition-transform">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full gradient-primary text-lg font-bold text-primary-foreground">
              {d.full_name.split(" ")[1]?.[0] ?? "د"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{d.full_name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{d.specialties?.name_ar}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" />{d.rating}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.baladiyas?.name_ar}</span>
                <span>{d.fee} دج</span>
              </div>
            </div>
            <a href={`tel:${d.phone}`} onClick={(e) => e.stopPropagation()} className="flex h-11 w-11 items-center justify-center rounded-full bg-success text-success-foreground">
              <Phone className="h-4 w-4" />
            </a>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

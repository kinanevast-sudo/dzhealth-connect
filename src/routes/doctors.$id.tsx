import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Phone, MapPin, Share2, Star, MessageCircle, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/doctors/$id")({ component: Detail });

function Detail() {
  const { id } = Route.useParams();
  const { data: d } = useQuery({
    queryKey: ["doctor", id],
    queryFn: async () => {
      const { data } = await supabase.from("doctors").select("*,specialties(name_ar),wilayas(name_ar),baladiyas(name_ar)").eq("id", id).maybeSingle();
      return data;
    },
  });
  if (!d) return <div className="p-8 text-center text-muted-foreground">جارٍ التحميل...</div>;
  const x = d as any;
  return (
    <div className="min-h-[100dvh] pb-28" style={{ background: "var(--gradient-hero)" }}>
      <header className="sticky top-0 z-30 glass flex items-center justify-between px-4 py-3">
        <a href="/doctors" className="rounded-full p-2 bg-surface"><ArrowRight className="h-5 w-5 rotate-180" /></a>
        <button className="rounded-full p-2 bg-surface"><Heart className="h-5 w-5" /></button>
      </header>

      <div className="relative h-72 overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-30" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-40 w-40 items-center justify-center rounded-3xl gradient-primary text-5xl font-extrabold text-primary-foreground neon-glow">
            {x.full_name.split(" ")[1]?.[0] ?? "د"}
          </div>
        </div>
      </div>

      <div className="-mt-6 px-5">
        <div className="rounded-3xl bg-surface card-elevated p-5">
          <h1 className="text-xl font-extrabold">{x.full_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{x.specialties?.name_ar}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {x.wilayas?.name_ar} - {x.baladiyas?.name_ar}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="سنوات الخبرة" value={x.experience_years ?? "-"} />
            <Stat label="مرضى" value={`+${(x.patients_count ?? 0).toLocaleString()}`} />
            <Stat label="نسبة الرضا" value={`${x.satisfaction ?? 95}%`} />
          </div>
        </div>

        <div className="mt-4 rounded-3xl bg-surface card-elevated p-5">
          <h3 className="text-sm font-bold">نبذة عن الطبيب</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{x.about}</p>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="font-bold">{x.rating}</span>
            <span className="text-muted-foreground">({x.reviews_count} تقييم)</span>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <a href={`tel:${x.phone}`} className="flex flex-1 items-center justify-center gap-2 rounded-2xl gradient-primary py-3 text-sm font-bold text-primary-foreground neon-glow">
            <Phone className="h-4 w-4" /> اتصال
          </a>
          <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface card-elevated"><MessageCircle className="h-5 w-5" /></button>
          <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface card-elevated"><Share2 className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 glass p-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div><p className="text-[11px] text-muted-foreground">رسوم الاستشارة</p><p className="text-lg font-extrabold">{x.fee} دج</p></div>
          <button className="rounded-2xl gradient-primary px-8 py-3 text-sm font-bold text-primary-foreground neon-glow">احجز موعد</button>
        </div>
      </div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-surface-2 py-3">
      <p className="text-base font-extrabold text-primary">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

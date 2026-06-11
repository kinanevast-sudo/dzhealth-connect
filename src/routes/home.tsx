import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search, MapPin, Phone, Stethoscope, Building2, Pill, Droplet, Accessibility, Leaf, ShieldPlus, PawPrint, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/home")({ component: Home });

const services = [
  { icon: Stethoscope, label: "الأطباء", to: "/doctors", color: "var(--primary)" },
  { icon: Building2, label: "المستشفيات", to: "/hospitals", color: "var(--primary-glow)" },
  { icon: Pill, label: "الصيدليات", to: "/pharmacies", color: "var(--success)" },
  { icon: Droplet, label: "متبرعو الدم", to: "/donors", color: "var(--blood)" },
  { icon: Accessibility, label: "المعدات الطبية", to: "/equipment", color: "var(--warning)" },
  { icon: Leaf, label: "الطب البديل", to: "/search", color: "var(--success)" },
  { icon: ShieldPlus, label: "الحماية المدنية", to: "/search", color: "var(--destructive)" },
  { icon: PawPrint, label: "الطب البيطري", to: "/search", color: "var(--primary)" },
];

function Home() {
  const { data: doctors } = useQuery({
    queryKey: ["featured-doctors"],
    queryFn: async () => {
      const { data } = await supabase.from("doctors").select("id,full_name,rating,photo_url,specialty_id,specialties(name_ar)").limit(4);
      return data ?? [];
    },
  });

  const { data: emergency } = useQuery({
    queryKey: ["emergency-donor"],
    queryFn: async () => {
      const { data } = await supabase.from("blood_donors").select("*,wilayas(name_ar),baladiyas(name_ar)").eq("emergency", true).limit(1).maybeSingle();
      return data;
    },
  });

  return (
    <AppShell>
      <div style={{ background: "var(--gradient-hero)" }}>
        {/* Header */}
        <header className="px-5 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مرحبًا 👋</p>
              <h1 className="text-xl font-extrabold">أحمد محمد</h1>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> عنابة - الجزائر
              </div>
            </div>
            <Link to="/notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface card-elevated">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blood text-[10px] font-bold text-blood-foreground">2</span>
            </Link>
          </div>

          {/* Search */}
          <Link to="/search" className="mt-4 flex items-center gap-2 rounded-2xl glass px-4 py-3 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            ابحث عن طبيب، تخصص، ولاية...
          </Link>
        </header>

        {/* Services grid */}
        <section className="px-5">
          <div className="grid grid-cols-4 gap-3">
            {services.map((s) => (
              <Link key={s.label} to={s.to} className="flex flex-col items-center gap-2 rounded-2xl bg-surface card-elevated px-2 py-4 active:scale-95 transition-transform">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${s.color}22`, boxShadow: `0 0 16px ${s.color}33` }}>
                  <s.icon className="h-6 w-6" style={{ color: s.color }} />
                </div>
                <span className="text-[10px] font-semibold leading-tight text-center">{s.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured doctors */}
        <section className="mt-6 px-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">أطباء مميزون</h2>
            <Link to="/doctors" className="text-xs text-primary">عرض الكل</Link>
          </div>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {(doctors ?? []).map((d: any) => (
              <Link key={d.id} to="/doctors/$id" params={{ id: d.id }} className="min-w-[200px] rounded-2xl bg-surface card-elevated p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-primary-foreground font-bold">
                    {d.full_name.split(" ")[1]?.[0] ?? "د"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{d.full_name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{d.specialties?.name_ar}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px]">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span className="font-semibold">{d.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Emergency blood */}
        {emergency && (
          <section className="mt-6 px-5">
            <div className="rounded-2xl gradient-blood p-4 text-blood-foreground neon-glow animate-blood-pulse" style={{ boxShadow: "var(--shadow-blood)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-lg font-bold">{(emergency as any).blood_type}</div>
                    <div>
                      <p className="text-xs opacity-90">متبرع متاح الآن</p>
                      <p className="text-sm font-bold">{(emergency as any).wilayas?.name_ar} - {(emergency as any).baladiyas?.name_ar}</p>
                      <p className="text-[11px] opacity-80">{(emergency as any).phone}</p>
                    </div>
                  </div>
                </div>
                <a href={`tel:${(emergency as any).phone}`} className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Phone className="h-5 w-5" />
                </a>
              </div>
            </div>
          </section>
        )}

        <div className="h-8" />
      </div>
    </AppShell>
  );
}

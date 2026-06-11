import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Phone, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";

export const Route = createFileRoute("/donors")({ component: Donors });
const TYPES = ["الكل","O+","O-","A+","A-","B+","B-","AB+","AB-"];

function Donors() {
  const [filter, setFilter] = useState("الكل");
  const { data } = useQuery({
    queryKey: ["donors", filter],
    queryFn: async () => {
      let q = supabase.from("blood_donors").select("*,wilayas(name_ar),baladiyas(name_ar)");
      if (filter !== "الكل") q = q.eq("blood_type", filter);
      const { data } = await q;
      return data ?? [];
    },
  });

  return (
    <AppShell>
      <div style={{ background: "linear-gradient(180deg, oklch(0.24 0.08 25) 0%, var(--background) 60%)" }}>
        <ScreenHeader title="متبرعو الدم" />
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`min-w-[52px] rounded-full px-3 py-1.5 text-xs font-bold transition-all ${filter === t ? "gradient-blood text-blood-foreground" : "bg-surface text-muted-foreground"}`}>{t}</button>
          ))}
        </div>

        <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl gradient-blood p-3 text-blood-foreground">
          <AlertTriangle className="h-5 w-5" />
          <div className="flex-1"><p className="text-sm font-bold">حالة طارئة</p><p className="text-[11px] opacity-90">تبرع الآن، يمكن أن تنقذ حياة شخص ما</p></div>
        </div>
      </div>

      <div className="space-y-3 px-4">
        {(data ?? []).map((d: any) => (
          <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-surface card-elevated p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-blood text-blood-foreground font-bold">{d.blood_type}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{d.full_name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{d.wilayas?.name_ar} - {d.baladiyas?.name_ar}</p>
              {d.available && <span className="mt-1 inline-block text-[10px] font-bold text-blood">متاح الآن</span>}
            </div>
            <a href={`tel:${d.phone}`} className="flex h-11 w-11 items-center justify-center rounded-full gradient-blood text-blood-foreground"><Phone className="h-4 w-4" /></a>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

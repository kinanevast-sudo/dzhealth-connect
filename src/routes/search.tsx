import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";

export const Route = createFileRoute("/search")({ component: Page });

function Page() {
  const { data: specs } = useQuery({ queryKey: ["specs"], queryFn: async () => (await supabase.from("specialties").select("*")).data ?? [] });
  return (
    <AppShell>
      <ScreenHeader title="البحث" />
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 rounded-2xl bg-surface card-elevated px-4 py-3">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input placeholder="ابحث عن تخصص أو طبيب..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <h3 className="mt-5 mb-2 text-sm font-bold">التخصصات الشائعة</h3>
        <div className="space-y-2">
          {(specs ?? []).map((s: any) => (
            <Link key={s.id} to="/doctors" className="flex items-center justify-between rounded-2xl bg-surface card-elevated px-4 py-3">
              <span className="text-sm font-semibold">{s.name_ar}</span>
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

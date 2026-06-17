import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Pill, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FormShell, Field, inputCls } from "@/components/FormShell";

export const Route = createFileRoute("/add-on-call-pharmacy")({ component: Page, ssr: false });

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function Page() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [q, setQ] = useState("");
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [shift, setShift] = useState<"day" | "night" | "full">("full");

  const { data: pharmacies = [], isLoading } = useQuery({
    queryKey: ["pharmacies-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacies")
        .select("id,name,phone,wilayas(name_ar),baladiyas(name_ar)")
        .order("name")
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return pharmacies;
    return (pharmacies as any[]).filter((p) =>
      p.name?.toLowerCase().includes(t) ||
      p.wilayas?.name_ar?.includes(q) ||
      p.baladiyas?.name_ar?.includes(q)
    );
  }, [pharmacies, q]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyId) { toast.error("اختر صيدلية"); return; }
    if (!date) { toast.error("اختر تاريخ المناوبة"); return; }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await (supabase.from as any)("pharmacy_on_call").insert({
      pharmacy_id: pharmacyId,
      on_call_date: date,
      shift_type: shift,
      created_by: u.user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") { toast.error("هذه الصيدلية مسجلة مناوبة لنفس التاريخ والفترة"); return; }
      toast.error(error.message);
      return;
    }
    toast.success("تم تسجيل الصيدلية المناوبة");
    navigate({ to: "/on-call-pharmacies" });
  };

  return (
    <FormShell title="تسجيل صيدلية مناوبة" onSubmit={submit} submitting={submitting}>
      <Field label="تاريخ المناوبة *">
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} required />
        <p className="mt-1 text-[11px] text-muted-foreground">الافتراضي اليوم. الصيدلية تبقى مسجلة مرة واحدة فقط، ويتم إنشاء سجل مناوبة لكل تاريخ.</p>
      </Field>

      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">اختر الصيدلية *</p>
          <Link to="/add-pharmacy" className="text-[11px] font-bold text-primary flex items-center gap-1">
            <Plus className="w-3 h-3" /> إضافة جديدة
          </Link>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground" />
          <input
            className={`${inputCls} pe-9`}
            placeholder="ابحث عن صيدلية بالاسم أو الولاية..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1.5 -mx-1 px-1">
          {isLoading && <p className="text-xs text-muted-foreground py-4 text-center">جارٍ التحميل...</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">لا توجد نتائج</p>
          )}
          {filtered.map((p: any) => {
            const selected = pharmacyId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPharmacyId(p.id)}
                className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition ${selected ? "bg-green-500/10 border-green-500" : "bg-background border-border"}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selected ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  {selected ? <Check className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.baladiyas?.name_ar ? `${p.baladiyas.name_ar} - ` : ""}{p.wilayas?.name_ar ?? "—"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </FormShell>
  );
}

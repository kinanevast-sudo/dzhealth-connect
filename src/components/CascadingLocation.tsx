import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function CascadingLocation({
  wilayaId, baladiyaId, onChange,
}: {
  wilayaId: number | null;
  baladiyaId: number | null;
  onChange: (w: number | null, b: number | null) => void;
}) {
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [baladiyas, setBaladiyas] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("wilayas").select("id,name_ar,code").order("id").then(({ data }) => setWilayas(data ?? []));
  }, []);

  useEffect(() => {
    if (!wilayaId) { setBaladiyas([]); return; }
    supabase.from("baladiyas").select("id,name_ar").eq("wilaya_id", wilayaId).order("name_ar")
      .then(({ data }) => setBaladiyas(data ?? []));
  }, [wilayaId]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="block">
        <span className="mb-1 block text-xs text-muted-foreground">الولاية</span>
        <select
          value={wilayaId ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null, null)}
          className="w-full rounded-xl bg-input px-3 py-3 text-sm"
        >
          <option value="">اختر</option>
          {wilayas.map((w) => (
            <option key={w.id} value={w.id}>{w.code} - {w.name_ar}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-muted-foreground">البلدية</span>
        <select
          value={baladiyaId ?? ""}
          disabled={!wilayaId}
          onChange={(e) => onChange(wilayaId, e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-xl bg-input px-3 py-3 text-sm disabled:opacity-50"
        >
          <option value="">{wilayaId ? "اختر" : "اختر الولاية أولاً"}</option>
          {baladiyas.map((b) => (
            <option key={b.id} value={b.id}>{b.name_ar}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

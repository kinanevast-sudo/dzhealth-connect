import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pill, Phone, MapPin, Map as MapIcon, Clock, ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { openMap } from "@/lib/map";

export const Route = createFileRoute("/pharmacies/$id")({ component: Page });

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function Page() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: p, isLoading, isError } = useQuery({
    queryKey: ["pharmacy", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacies")
        .select("id,name,phone,address,lat,lng,is_24_7,open_until,photo_url,wilayas(name_ar),baladiyas(name_ar)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: onCallToday } = useQuery({
    queryKey: ["pharmacy-on-call-today", id, todayISO()],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("pharmacy_on_call")
        .select("id")
        .eq("pharmacy_id", id)
        .eq("on_call_date", todayISO())
        .maybeSingle();
      return !!data;
    },
  });

  return (
    <AppShell>
      <ScreenHeader title={t("pharmacyDetail.screenTitle")} />
      <div className="px-4 pt-3 pb-6">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        {!isLoading && (isError || !p) && (
          <div className="rounded-2xl bg-surface card-elevated p-8 text-center text-sm text-muted-foreground">
            <p>{t("pharmacyDetail.notFound")}</p>
            <Link to="/on-call-pharmacies" className="mt-3 inline-flex items-center gap-1 text-primary text-xs font-bold">
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" /> {t("pharmacyDetail.backToList")}
            </Link>
          </div>
        )}
        {!isLoading && p && (
          <div className="space-y-4">
            {/* Hero */}
            <div className="rounded-2xl overflow-hidden bg-card border border-border">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name} className="w-full h-44 object-cover" />
              ) : (
                <div className="w-full h-44 flex items-center justify-center bg-gradient-to-br from-green-600/20 to-emerald-700/20">
                  <Pill className="w-16 h-16 text-green-600" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-xl font-black text-foreground">{p.name}</h1>
                    <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {(p as any).baladiyas?.name_ar ? `${(p as any).baladiyas.name_ar} - ` : ""}
                      {(p as any).wilayas?.name_ar ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    {onCallToday && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-green-600 text-white">
                        {t("pharmacyDetail.onCallBadge")}
                      </span>
                    )}
                    {p.is_24_7 && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-500">
                        24/7
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <h2 className="text-sm font-extrabold text-foreground">{t("pharmacyDetail.infoTitle")}</h2>
              <InfoRow icon={<MapPin className="w-4 h-4 text-primary" />} label={t("pharmacyDetail.addressLabel")} value={p.address || ((p as any).baladiyas?.name_ar ? `${(p as any).baladiyas.name_ar}، ${(p as any).wilayas?.name_ar ?? ""}` : (p as any).wilayas?.name_ar) || t("pharmacyDetail.addressFallback")} />
              <InfoRow icon={<Phone className="w-4 h-4 text-primary" />} label={t("pharmacyDetail.phoneLabel")} value={p.phone || t("pharmacyDetail.phoneFallback")} />
              {p.open_until && (
                <InfoRow icon={<Clock className="w-4 h-4 text-primary" />} label={t("pharmacyDetail.openUntilLabel")} value={p.open_until} />
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={p.phone ? `tel:${p.phone}` : "#"}
                onClick={(e) => { if (!p.phone) e.preventDefault(); }}
                className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold text-white ${p.phone ? "bg-green-600 active:scale-95" : "bg-muted text-muted-foreground"}`}
              >
                <Phone className="w-4 h-4" /> {t("pharmacyDetail.callButton")}
              </a>
              <button
                onClick={() => openMap(p.lat as any, p.lng as any, p.name)}
                disabled={!p.lat || !p.lng}
                className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold text-white ${p.lat && p.lng ? "bg-cyan-700 active:scale-95" : "bg-muted text-muted-foreground"}`}
              >
                <MapIcon className="w-4 h-4" /> {t("pharmacyDetail.mapButton")}
              </button>
            </div>

            <Link to="/on-call-pharmacies" className="block text-center text-xs text-primary font-bold py-2">
              {t("pharmacyDetail.viewAllOnCall")}
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

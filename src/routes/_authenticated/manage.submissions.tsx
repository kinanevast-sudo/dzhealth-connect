import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Edit3, Loader2, MapPin, ImageIcon, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/manage/submissions")({
  ssr: false,
  component: SubmissionsPage,
});

type Submission = {
  id: string;
  content_type: string;
  payload: Record<string, unknown>;
  images: string[] | null;
  lat: number | null;
  lng: number | null;
  status: string;
  priority: string;
  rejection_reason: string | null;
  internal_notes: string | null;
  submitter_id: string | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const STATUS_TABS = ["pending", "approved", "rejected", "all"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function SubmissionsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<StatusTab>("pending");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [items, setItems] = useState<Submission[] | null>(null);
  const [active, setActive] = useState<Submission | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [editJson, setEditJson] = useState("");

  const load = async () => {
    setItems(null);
    let q = supabase.from("pending_submissions").select("*").order("created_at", { ascending: false }).limit(200);
    if (tab !== "all") q = q.eq("status", tab);
    if (typeFilter !== "all") q = q.eq("content_type", typeFilter);
    const { data, error } = await q;
    if (error) { toast.error(error.message); setItems([]); return; }
    setItems((data ?? []) as Submission[]);
  };

  useEffect(() => { load(); }, [tab, typeFilter]);

  useEffect(() => {
    const ch = supabase
      .channel("manage-subs")
      .on("postgres_changes", { event: "*", schema: "public", table: "pending_submissions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, typeFilter]);

  const types = useMemo(() => {
    const set = new Set<string>(items?.map((i) => i.content_type) ?? []);
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  const approve = async (id: string, override?: Record<string, unknown>) => {
    setBusy(true);
    const { error } = await supabase.rpc("approve_submission", { _id: id, _override_payload: (override ?? null) as never });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("manage.subs.approvedOk"));
    setActive(null); setEditOpen(false);
    load();
  };

  const reject = async () => {
    if (!active) return;
    if (!rejectReason.trim()) { toast.error(t("manage.subs.reasonRequired")); return; }
    setBusy(true);
    const { error } = await supabase.rpc("reject_submission", { _id: active.id, _reason: rejectReason.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("manage.subs.rejectedOk"));
    setRejectOpen(false); setActive(null); setRejectReason("");
    load();
  };

  const openEdit = () => {
    if (!active) return;
    setEditJson(JSON.stringify(active.payload, null, 2));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!active) return;
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(editJson); }
    catch { toast.error(t("manage.subs.invalidJson")); return; }
    await approve(active.id, parsed);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("manage.subs.title")}</h1>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {types.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === s ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`manage.subs.tabs.${s}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items === null && (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {items?.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            {t("manage.subs.empty")}
          </div>
        )}
        {items?.map((s) => (
          <SubCard key={s.id} sub={s} onOpen={() => setActive(s)} />
        ))}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!active && !rejectOpen && !editOpen} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {active.content_type}
                  <Badge variant="outline">{active.status}</Badge>
                  {active.priority !== "normal" && <Badge>{active.priority}</Badge>}
                </DialogTitle>
                <DialogDescription>
                  {new Date(active.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <PayloadView sub={active} />
              {active.status === "pending" && (
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={openEdit} disabled={busy}>
                    <Edit3 className="h-4 w-4 mr-1" />
                    {t("manage.subs.editBeforeApprove")}
                  </Button>
                  <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={busy}>
                    <XCircle className="h-4 w-4 mr-1" />
                    {t("manage.subs.reject")}
                  </Button>
                  <Button onClick={() => approve(active.id)} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1" />{t("manage.subs.approve")}</>}
                  </Button>
                </DialogFooter>
              )}
              {active.status === "rejected" && active.rejection_reason && (
                <div className="text-sm bg-rose-500/10 border border-rose-500/30 rounded-md p-3">
                  <span className="font-semibold">{t("manage.subs.reason")}: </span>{active.rejection_reason}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("manage.subs.rejectTitle")}</DialogTitle>
            <DialogDescription>{t("manage.subs.rejectDesc")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t("manage.subs.reasonPlaceholder")}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>{t("manage.subs.cancel")}</Button>
            <Button variant="destructive" onClick={reject} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("manage.subs.confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("manage.subs.editTitle")}</DialogTitle>
            <DialogDescription>{t("manage.subs.editDesc")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editJson}
            onChange={(e) => setEditJson(e.target.value)}
            rows={16}
            className="font-mono text-xs"
            dir="ltr"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t("manage.subs.cancel")}</Button>
            <Button onClick={saveEdit} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("manage.subs.saveAndApprove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubCard({ sub, onOpen }: { sub: Submission; onOpen: () => void }) {
  const { t } = useTranslation();
  const title = (sub.payload?.["full_name"] || sub.payload?.["name"] || sub.content_type) as string;
  return (
    <button
      onClick={onOpen}
      className="text-start bg-card border border-border rounded-2xl p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">{sub.content_type}</Badge>
            <Badge
              className={
                sub.status === "pending" ? "bg-amber-500/20 text-amber-300" :
                sub.status === "approved" ? "bg-emerald-500/20 text-emerald-300" :
                "bg-rose-500/20 text-rose-300"
              }
            >
              {sub.status}
            </Badge>
            {sub.priority !== "normal" && <Badge variant="secondary">{sub.priority}</Badge>}
          </div>
          <h3 className="mt-2 font-semibold truncate">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(sub.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          {sub.images && sub.images.length > 0 && <ImageIcon className="h-4 w-4" />}
          {sub.lat != null && sub.lng != null && <MapPin className="h-4 w-4" />}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground truncate">
        {t("manage.subs.tapToReview")}
      </p>
    </button>
  );
}

function PayloadView({ sub }: { sub: Submission }) {
  const { t } = useTranslation();
  const entries = Object.entries(sub.payload ?? {});
  const mapUrl = sub.lat != null && sub.lng != null
    ? `https://www.openstreetmap.org/?mlat=${sub.lat}&mlon=${sub.lng}#map=15/${sub.lat}/${sub.lng}`
    : null;

  return (
    <div className="space-y-4">
      {sub.images && sub.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {sub.images.map((src, i) => (
            <a key={i} href={src} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg bg-muted">
              <img src={src} alt="" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}
      <div className="rounded-md border border-border divide-y divide-border">
        {entries.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">{t("manage.subs.emptyPayload")}</p>
        )}
        {entries.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 p-2.5 text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className="text-end break-words max-w-[60%]" dir="auto">
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))}
      </div>
      {mapUrl && (
        <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <MapPin className="h-4 w-4" />
          {t("manage.subs.openMap")} ({sub.lat?.toFixed(4)}, {sub.lng?.toFixed(4)})
        </a>
      )}
    </div>
  );
}

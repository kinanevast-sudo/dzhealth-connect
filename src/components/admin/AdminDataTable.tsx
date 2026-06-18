import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ResourceDef, FieldDef } from "@/lib/admin/resources";

interface Props {
  resource: ResourceDef;
}

const PAGE_SIZE = 20;

type Lang = "ar" | "fr" | "en";
const lang = (i18nLang: string): Lang =>
  (["ar", "fr", "en"].includes(i18nLang) ? (i18nLang as Lang) : "ar");

export function AdminDataTable({ resource }: Props) {
  const { t, i18n } = useTranslation();
  const lng = lang(i18n.language);

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Record<string, unknown> | null>(null);
  const [lookups, setLookups] = useState<Record<string, Map<number | string, string>>>({});

  const pk = resource.pk ?? "id";

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from(resource.table as never)
      .select("*", { count: "exact" })
      .order(resource.orderBy, { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (search && resource.searchable.length > 0) {
      const ors = resource.searchable.map((c) => `${c}.ilike.%${search}%`).join(",");
      q = q.or(ors);
    }
    const { data, count: c, error } = await q;
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows((data as Record<string, unknown>[]) ?? []);
    setCount(c ?? 0);
  };

  // Load lookups (wilayas/specialties/baladiyas) once
  useEffect(() => {
    const needs = new Set<string>();
    for (const f of resource.fields) if (f.lookup) needs.add(f.lookup);
    for (const c of resource.list) if (c.key === "wilaya_id") needs.add("wilayas");

    (async () => {
      const out: typeof lookups = {};
      for (const name of needs) {
        const cols = name === "specialties"
          ? "id, name_ar, name_fr, name_en"
          : "id, name_ar, name_fr";
        const { data } = await supabase.from(name as never).select(cols);
        const map = new Map<number | string, string>();
        for (const row of (data as Array<Record<string, unknown>>) ?? []) {
          const id = row.id as number | string;
          const label =
            (row[`name_${lng}` as keyof typeof row] as string | undefined) ??
            (row.name_ar as string | undefined) ??
            String(id);
          map.set(id, label);
        }
        out[name] = map;
      }
      setLookups(out);
    })();
  }, [resource.slug, lng]);

  useEffect(() => { load(); }, [resource.slug, page, search]);

  const onSearch = () => { setPage(0); setSearch(searchInput.trim()); };

  const exportCsv = () => {
    if (rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${resource.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const renderCell = (col: { key: string }, row: Record<string, unknown>) => {
    const v = row[col.key];
    if (col.key === "wilaya_id" && lookups.wilayas) return lookups.wilayas.get(v as number) ?? "—";
    if (col.key === "specialty_id" && lookups.specialties) return lookups.specialties.get(v as number) ?? "—";
    if (typeof v === "boolean") return v ? <Badge variant="default">✓</Badge> : <Badge variant="outline">—</Badge>;
    if (v == null || v === "") return <span className="text-muted-foreground">—</span>;
    if (typeof v === "string" && v.length > 60) return v.slice(0, 60) + "…";
    return String(v);
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{resource.label[lng]}</h1>
          <p className="text-xs text-muted-foreground">{t("manage.crud.total", { count })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="h-4 w-4 me-1.5" /> {t("manage.crud.export")}
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 me-1.5" /> {t("manage.crud.add")}
          </Button>
        </div>
      </div>

      {resource.searchable.length > 0 && (
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder={t("manage.crud.searchPlaceholder")}
              className="ps-9"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={onSearch}>{t("manage.crud.search")}</Button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {resource.list.map((c) => (
                <TableHead key={c.key}>{c.label[lng]}</TableHead>
              ))}
              <TableHead className="text-end">{t("manage.crud.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={resource.list.length + 1} className="text-center py-10">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              </TableCell></TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow><TableCell colSpan={resource.list.length + 1} className="text-center py-10 text-sm text-muted-foreground">
                {t("manage.crud.empty")}
              </TableCell></TableRow>
            )}
            {!loading && rows.map((r) => (
              <TableRow key={String(r[pk])}>
                {resource.list.map((c) => (
                  <TableCell key={c.key} className="text-sm">{renderCell(c, r)}</TableCell>
                ))}
                <TableCell className="text-end">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t("manage.crud.page", { page: page + 1, total: totalPages })}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(editing || creating) && (
        <RecordEditor
          resource={resource}
          row={editing}
          lookups={lookups}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("manage.crud.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("manage.crud.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("manage.crud.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleting) return;
                const { error } = await supabase.from(resource.table as never).delete().eq(pk, deleting[pk] as never);
                if (error) toast.error(error.message);
                else { toast.success(t("manage.crud.deletedOk")); load(); }
                setDeleting(null);
              }}
            >
              {t("manage.crud.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RecordEditor({
  resource, row, lookups, onClose, onSaved,
}: {
  resource: ResourceDef;
  row: Record<string, unknown> | null;
  lookups: Record<string, Map<number | string, string>>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, i18n } = useTranslation();
  const lng = lang(i18n.language);
  const isNew = !row;
  const pk = resource.pk ?? "id";

  const initial = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const f of resource.fields) out[f.key] = row?.[f.key] ?? (f.type === "boolean" ? false : "");
    return out;
  }, [resource.slug, row]);

  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setValues(initial); }, [initial]);

  const save = async () => {
    setSaving(true);
    // Coerce numeric/empty
    const payload: Record<string, unknown> = {};
    for (const f of resource.fields) {
      const v = values[f.key];
      if (f.type === "number") payload[f.key] = v === "" || v == null ? null : Number(v);
      else if (f.type === "boolean") payload[f.key] = !!v;
      else if (v === "") payload[f.key] = null;
      else payload[f.key] = v;
    }
    let error;
    if (isNew) {
      const r = await supabase.from(resource.table as never).insert(payload as never);
      error = r.error;
    } else {
      const r = await supabase.from(resource.table as never).update(payload as never).eq(pk, row![pk] as never);
      error = r.error;
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isNew ? t("manage.crud.createdOk") : t("manage.crud.savedOk"));
    onSaved();
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isNew ? t("manage.crud.createTitle") : t("manage.crud.editTitle")}</SheetTitle>
          <SheetDescription>{resource.label[lng]}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          {resource.fields.map((f) => (
            <FieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} lookups={lookups} lng={lng} />
          ))}
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{t("manage.crud.cancel")}</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 me-1.5 animate-spin" />} {t("manage.crud.save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FieldInput({
  field, value, onChange, lookups, lng,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  lookups: Record<string, Map<number | string, string>>;
  lng: Lang;
}) {
  const id = `f-${field.key}`;
  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <Label htmlFor={id}>{field.label[lng]}</Label>
        <Switch id={id} checked={!!value} onCheckedChange={onChange} />
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{field.label[lng]}{field.required && " *"}</Label>
        <Textarea id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={3} />
      </div>
    );
  }
  if (field.type === "select") {
    const opts: { value: string; label: string }[] = [];
    if (field.options) for (const o of field.options) opts.push({ value: String(o.value), label: o.label });
    if (field.lookup && lookups[field.lookup]) {
      for (const [k, v] of lookups[field.lookup].entries()) opts.push({ value: String(k), label: v });
    }
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{field.label[lng]}{field.required && " *"}</Label>
        <Select
          value={value == null || value === "" ? undefined : String(value)}
          onValueChange={(v) => onChange(field.lookup || field.options?.some((o) => typeof o.value === "number") ? (isNaN(Number(v)) ? v : Number(v)) : v)}
        >
          <SelectTrigger id={id}><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent className="max-h-72">
            {opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{field.label[lng]}{field.required && " *"}</Label>
      <Input
        id={id}
        type={field.type === "number" ? "number" : "text"}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

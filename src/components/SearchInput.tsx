import { Search as SearchIcon, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: Props) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("searchInput.placeholder");
  return (
    <div className="relative flex items-center rounded-2xl px-3 py-3" style={{ background: "#e0f2fe" }}>
      <SearchIcon className="h-4 w-4 shrink-0" style={{ color: "#64748b" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        className="flex-1 bg-transparent px-2 text-sm outline-none text-right placeholder:text-slate-500"
      />
      <button
        type="button"
        aria-label={t("searchInput.voice_input")}
        className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: "#bae6fd" }}
      >
        <Mic className="h-3.5 w-3.5" style={{ color: "#0891b2" }} />
      </button>
    </div>
  );
}

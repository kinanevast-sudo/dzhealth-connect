import { useState } from "react";
import { MapPin, Check } from "lucide-react";
import { MapLocationPicker, type PickedLocation } from "./MapLocationPicker";
import { useTranslation } from "react-i18next";

export function LocationPickerField({
  lat, lng, onPicked,
}: {
  lat: number | null;
  lng: number | null;
  onPicked: (loc: PickedLocation) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const picked = lat != null && lng != null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 transition-all active:scale-95 ${
          picked ? "bg-green-500/10 border border-green-500/40 text-green-600" : "bg-primary/10 border border-primary/30 text-primary"
        }`}
      >
        {picked ? <Check className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
        <span className="text-sm font-semibold">
          {picked
            ? t("locationPickerField.location_set", { lat: lat!.toFixed(4), lng: lng!.toFixed(4) })
            : t("locationPickerField.pick_location")}
        </span>
      </button>
      <MapLocationPicker
        open={open}
        onClose={() => setOpen(false)}
        initial={picked ? { lat: lat!, lng: lng! } : null}
        onConfirm={(loc) => { onPicked(loc); setOpen(false); }}
      />
    </>
  );
}

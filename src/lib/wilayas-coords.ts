// Coordinates of Algerian wilaya capitals (58 wilayas).
// Used to convert GPS coordinates to the nearest wilaya id.
import { haversineKm } from "./geo";

export type WilayaCoord = { id: number; name_ar: string; lat: number; lng: number };

export const WILAYA_CAPITALS: WilayaCoord[] = [
  { id: 1,  name_ar: "أدرار",         lat: 27.8742, lng: -0.2939 },
  { id: 2,  name_ar: "الشلف",         lat: 36.1654, lng: 1.3346 },
  { id: 3,  name_ar: "الأغواط",       lat: 33.8000, lng: 2.8650 },
  { id: 4,  name_ar: "أم البواقي",    lat: 35.8753, lng: 7.1136 },
  { id: 5,  name_ar: "باتنة",         lat: 35.5559, lng: 6.1741 },
  { id: 6,  name_ar: "بجاية",         lat: 36.7525, lng: 5.0843 },
  { id: 7,  name_ar: "بسكرة",         lat: 34.8500, lng: 5.7333 },
  { id: 8,  name_ar: "بشار",          lat: 31.6177, lng: -2.2161 },
  { id: 9,  name_ar: "البليدة",       lat: 36.4700, lng: 2.8300 },
  { id: 10, name_ar: "البويرة",       lat: 36.3742, lng: 3.9019 },
  { id: 11, name_ar: "تمنراست",       lat: 22.7850, lng: 5.5228 },
  { id: 12, name_ar: "تبسة",          lat: 35.4042, lng: 8.1242 },
  { id: 13, name_ar: "تلمسان",        lat: 34.8828, lng: -1.3167 },
  { id: 14, name_ar: "تيارت",         lat: 35.3711, lng: 1.3170 },
  { id: 15, name_ar: "تيزي وزو",      lat: 36.7169, lng: 4.0497 },
  { id: 16, name_ar: "الجزائر",       lat: 36.7538, lng: 3.0588 },
  { id: 17, name_ar: "الجلفة",        lat: 34.6667, lng: 3.2500 },
  { id: 18, name_ar: "جيجل",          lat: 36.8208, lng: 5.7669 },
  { id: 19, name_ar: "سطيف",          lat: 36.1898, lng: 5.4108 },
  { id: 20, name_ar: "سعيدة",         lat: 34.8417, lng: 0.1517 },
  { id: 21, name_ar: "سكيكدة",        lat: 36.8761, lng: 6.9094 },
  { id: 22, name_ar: "سيدي بلعباس",   lat: 35.1908, lng: -0.6308 },
  { id: 23, name_ar: "عنابة",         lat: 36.9000, lng: 7.7667 },
  { id: 24, name_ar: "قالمة",         lat: 36.4622, lng: 7.4283 },
  { id: 25, name_ar: "قسنطينة",       lat: 36.3650, lng: 6.6147 },
  { id: 26, name_ar: "المدية",        lat: 36.2675, lng: 2.7544 },
  { id: 27, name_ar: "مستغانم",       lat: 35.9314, lng: 0.0892 },
  { id: 28, name_ar: "المسيلة",       lat: 35.7058, lng: 4.5419 },
  { id: 29, name_ar: "معسكر",         lat: 35.3964, lng: 0.1411 },
  { id: 30, name_ar: "ورقلة",         lat: 31.9500, lng: 5.3333 },
  { id: 31, name_ar: "وهران",         lat: 35.6911, lng: -0.6417 },
  { id: 32, name_ar: "البيض",         lat: 33.6803, lng: 1.0192 },
  { id: 33, name_ar: "إليزي",         lat: 26.4833, lng: 8.4667 },
  { id: 34, name_ar: "برج بوعريريج",  lat: 36.0731, lng: 4.7611 },
  { id: 35, name_ar: "بومرداس",       lat: 36.7669, lng: 3.4775 },
  { id: 36, name_ar: "الطارف",        lat: 36.7672, lng: 8.3133 },
  { id: 37, name_ar: "تندوف",         lat: 27.6742, lng: -8.1478 },
  { id: 38, name_ar: "تيسمسيلت",      lat: 35.6072, lng: 1.8108 },
  { id: 39, name_ar: "الوادي",        lat: 33.3683, lng: 6.8675 },
  { id: 40, name_ar: "خنشلة",         lat: 35.4361, lng: 7.1436 },
  { id: 41, name_ar: "سوق أهراس",     lat: 36.2864, lng: 7.9514 },
  { id: 42, name_ar: "تيبازة",        lat: 36.5944, lng: 2.4472 },
  { id: 43, name_ar: "ميلة",          lat: 36.4500, lng: 6.2644 },
  { id: 44, name_ar: "عين الدفلى",    lat: 36.2647, lng: 1.9678 },
  { id: 45, name_ar: "النعامة",       lat: 33.2667, lng: -0.3167 },
  { id: 46, name_ar: "عين تموشنت",    lat: 35.2972, lng: -1.1408 },
  { id: 47, name_ar: "غرداية",        lat: 32.4900, lng: 3.6731 },
  { id: 48, name_ar: "غليزان",        lat: 35.7372, lng: 0.5558 },
  { id: 49, name_ar: "تيميمون",       lat: 29.2639, lng: 0.2306 },
  { id: 50, name_ar: "برج باجي مختار",lat: 21.3286, lng: 0.9544 },
  { id: 51, name_ar: "أولاد جلال",    lat: 34.4239, lng: 5.0686 },
  { id: 52, name_ar: "بني عباس",      lat: 30.1300, lng: -2.1700 },
  { id: 53, name_ar: "عين صالح",      lat: 27.1989, lng: 2.4806 },
  { id: 54, name_ar: "عين قزام",      lat: 19.5667, lng: 5.7667 },
  { id: 55, name_ar: "تقرت",          lat: 33.1000, lng: 6.0667 },
  { id: 56, name_ar: "جانت",          lat: 24.5544, lng: 9.4844 },
  { id: 57, name_ar: "المغير",        lat: 33.9542, lng: 5.9244 },
  { id: 58, name_ar: "المنيعة",       lat: 30.5775, lng: 2.8806 },
];

export function nearestWilaya(lat: number, lng: number): WilayaCoord {
  let best = WILAYA_CAPITALS[0];
  let bestD = Infinity;
  for (const w of WILAYA_CAPITALS) {
    const d = haversineKm({ lat, lng }, { lat: w.lat, lng: w.lng });
    if (d < bestD) { bestD = d; best = w; }
  }
  return best;
}

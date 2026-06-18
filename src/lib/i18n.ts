import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export type AppLang = "ar" | "fr" | "en";

const resources = {
  ar: {
    translation: {
      app: { name: "DzHealth", tagline: "كل الخدمات الصحية في الجزائر في مكان واحد" },
      nav: { home: "الرئيسية", search: "بحث", add: "إضافة", profile: "الملف الشخصي", map: "الخريطة" },
      common: {
        back: "رجوع",
        retry: "إعادة المحاولة",
        cancel: "إلغاء",
        confirm: "تأكيد",
        save: "حفظ",
        delete: "حذف",
        loading: "جاري التحميل…",
        more: "عرض المزيد",
        less: "عرض أقل",
        offline: "أنت غير متصل بالإنترنت",
        offlineDesc: "تحقق من اتصالك ثم حاول مرة أخرى.",
        notFound: "الصفحة غير موجودة",
        goHome: "العودة للرئيسية",
        error: "حدث خطأ",
      },
      settings: {
        title: "الإعدادات", appearance: "المظهر", language: "اللغة",
        preferences: "التفضيلات", account: "الحساب", logout: "تسجيل الخروج",
        light: "فاتح", dark: "داكن", system: "النظام",
      },
    },
  },
  fr: {
    translation: {
      app: { name: "DzHealth", tagline: "Tous les services de santé en Algérie au même endroit" },
      nav: { home: "Accueil", search: "Recherche", add: "Ajouter", profile: "Profil", map: "Carte" },
      common: {
        back: "Retour",
        retry: "Réessayer",
        cancel: "Annuler",
        confirm: "Confirmer",
        save: "Enregistrer",
        delete: "Supprimer",
        loading: "Chargement…",
        more: "Voir plus",
        less: "Voir moins",
        offline: "Vous êtes hors ligne",
        offlineDesc: "Vérifiez votre connexion puis réessayez.",
        notFound: "Page introuvable",
        goHome: "Retour à l'accueil",
        error: "Une erreur est survenue",
      },
      settings: {
        title: "Paramètres", appearance: "Apparence", language: "Langue",
        preferences: "Préférences", account: "Compte", logout: "Se déconnecter",
        light: "Clair", dark: "Sombre", system: "Système",
      },
    },
  },
  en: {
    translation: {
      app: { name: "DzHealth", tagline: "All health services in Algeria in one place" },
      nav: { home: "Home", search: "Search", add: "Add", profile: "Profile", map: "Map" },
      common: {
        back: "Back",
        retry: "Retry",
        cancel: "Cancel",
        confirm: "Confirm",
        save: "Save",
        delete: "Delete",
        loading: "Loading…",
        more: "Show more",
        less: "Show less",
        offline: "You are offline",
        offlineDesc: "Check your connection and try again.",
        notFound: "Page not found",
        goHome: "Back to home",
        error: "Something went wrong",
      },
      settings: {
        title: "Settings", appearance: "Appearance", language: "Language",
        preferences: "Preferences", account: "Account", logout: "Sign out",
        light: "Light", dark: "Dark", system: "System",
      },
    },
  },
} as const;

const LANG_KEY = "dzhealth-lang";

function initialLang(): AppLang {
  if (typeof localStorage === "undefined") return "ar";
  const v = localStorage.getItem(LANG_KEY) as AppLang | null;
  return v === "fr" || v === "en" || v === "ar" ? v : "ar";
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: initialLang(),
    fallbackLng: "ar",
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export function setAppLanguage(lang: AppLang) {
  if (typeof localStorage !== "undefined") localStorage.setItem(LANG_KEY, lang);
  if (typeof document !== "undefined") {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }
  return i18n.changeLanguage(lang);
}

export default i18n;

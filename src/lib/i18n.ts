import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

export type AppLang = "ar" | "fr" | "en";

const resources = {
  ar: {
    translation: {
      app: { name: "DzHealth", tagline: "كل الخدمات الصحية في الجزائر في مكان واحد" },
      nav: {
        home: "الرئيسية",
        search: "بحث",
        add: "إضافة",
        profile: "الملف الشخصي",
        map: "الخريطة",
        notifications: "الإشعارات",
        settings: "الإعدادات",
        doctors: "الأطباء",
        hospitals: "المستشفيات",
        pharmacies: "الصيدليات",
        donors: "المتبرعون",
      },
      common: {
        back: "رجوع",
        next: "التالي",
        previous: "السابق",
        retry: "إعادة المحاولة",
        cancel: "إلغاء",
        confirm: "تأكيد",
        save: "حفظ",
        delete: "حذف",
        edit: "تعديل",
        close: "إغلاق",
        search: "بحث",
        loading: "جاري التحميل…",
        more: "عرض المزيد",
        less: "عرض أقل",
        seeAll: "عرض الكل",
        offline: "أنت غير متصل بالإنترنت",
        offlineDesc: "تحقق من اتصالك ثم حاول مرة أخرى.",
        notFound: "الصفحة غير موجودة",
        goHome: "العودة للرئيسية",
        error: "حدث خطأ",
        tryAgain: "حاول مرة أخرى",
        yes: "نعم",
        no: "لا",
        ok: "موافق",
        signInRequired: "يجب تسجيل الدخول",
        success: "تم بنجاح",
      },
      settings: {
        title: "الإعدادات",
        appearance: "المظهر",
        mode: "الوضع",
        language: "اللغة",
        preferences: "التفضيلات",
        notifications: "الإشعارات",
        locationOn: "الموقع مفعّل (GPS)",
        locationOff: "تفعيل الموقع (GPS)",
        bloodNotifTitle: "إشعارات طلبات الدم",
        bloodReceive: "استقبال إشعارات طلبات الدم",
        bloodMatchOnly: "فصيلتي المتوافقة فقط",
        bloodCritical: "تنبيه إضافي للحالات الحرجة في بلديتي",
        account: "الحساب",
        privacy: "سياسة الخصوصية",
        help: "مركز المساعدة",
        about: "عن التطبيق",
        logout: "تسجيل الخروج",
        light: "فاتح",
        dark: "داكن",
        system: "النظام",
        saved: "تم حفظ الإعداد",
        saveError: "تعذّر حفظ الإعداد",
        madeWith: "Made with care",
      },
    },
  },
  fr: {
    translation: {
      app: { name: "DzHealth", tagline: "Tous les services de santé en Algérie au même endroit" },
      nav: {
        home: "Accueil",
        search: "Recherche",
        add: "Ajouter",
        profile: "Profil",
        map: "Carte",
        notifications: "Notifications",
        settings: "Paramètres",
        doctors: "Médecins",
        hospitals: "Hôpitaux",
        pharmacies: "Pharmacies",
        donors: "Donneurs",
      },
      common: {
        back: "Retour",
        next: "Suivant",
        previous: "Précédent",
        retry: "Réessayer",
        cancel: "Annuler",
        confirm: "Confirmer",
        save: "Enregistrer",
        delete: "Supprimer",
        edit: "Modifier",
        close: "Fermer",
        search: "Rechercher",
        loading: "Chargement…",
        more: "Voir plus",
        less: "Voir moins",
        seeAll: "Voir tout",
        offline: "Vous êtes hors ligne",
        offlineDesc: "Vérifiez votre connexion puis réessayez.",
        notFound: "Page introuvable",
        goHome: "Retour à l'accueil",
        error: "Une erreur est survenue",
        tryAgain: "Réessayer",
        yes: "Oui",
        no: "Non",
        ok: "OK",
        signInRequired: "Connexion requise",
        success: "Opération réussie",
      },
      settings: {
        title: "Paramètres",
        appearance: "Apparence",
        mode: "Mode",
        language: "Langue",
        preferences: "Préférences",
        notifications: "Notifications",
        locationOn: "Localisation activée (GPS)",
        locationOff: "Activer la localisation (GPS)",
        bloodNotifTitle: "Notifications de demandes de sang",
        bloodReceive: "Recevoir les notifications de demandes de sang",
        bloodMatchOnly: "Uniquement mon groupe compatible",
        bloodCritical: "Alerte supplémentaire pour les cas critiques dans ma commune",
        account: "Compte",
        privacy: "Politique de confidentialité",
        help: "Centre d'aide",
        about: "À propos",
        logout: "Se déconnecter",
        light: "Clair",
        dark: "Sombre",
        system: "Système",
        saved: "Préférence enregistrée",
        saveError: "Impossible d'enregistrer la préférence",
        madeWith: "Fait avec soin",
      },
    },
  },
  en: {
    translation: {
      app: { name: "DzHealth", tagline: "All health services in Algeria in one place" },
      nav: {
        home: "Home",
        search: "Search",
        add: "Add",
        profile: "Profile",
        map: "Map",
        notifications: "Notifications",
        settings: "Settings",
        doctors: "Doctors",
        hospitals: "Hospitals",
        pharmacies: "Pharmacies",
        donors: "Donors",
      },
      common: {
        back: "Back",
        next: "Next",
        previous: "Previous",
        retry: "Retry",
        cancel: "Cancel",
        confirm: "Confirm",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        close: "Close",
        search: "Search",
        loading: "Loading…",
        more: "Show more",
        less: "Show less",
        seeAll: "See all",
        offline: "You are offline",
        offlineDesc: "Check your connection and try again.",
        notFound: "Page not found",
        goHome: "Back to home",
        error: "Something went wrong",
        tryAgain: "Try again",
        yes: "Yes",
        no: "No",
        ok: "OK",
        signInRequired: "Sign-in required",
        success: "Success",
      },
      settings: {
        title: "Settings",
        appearance: "Appearance",
        mode: "Mode",
        language: "Language",
        preferences: "Preferences",
        notifications: "Notifications",
        locationOn: "Location enabled (GPS)",
        locationOff: "Enable location (GPS)",
        bloodNotifTitle: "Blood request notifications",
        bloodReceive: "Receive blood request notifications",
        bloodMatchOnly: "Only my compatible blood type",
        bloodCritical: "Extra alert for critical cases in my municipality",
        account: "Account",
        privacy: "Privacy policy",
        help: "Help center",
        about: "About",
        logout: "Sign out",
        light: "Light",
        dark: "Dark",
        system: "System",
        saved: "Preference saved",
        saveError: "Could not save preference",
        madeWith: "Made with care",
      },
    },
  },
} as const;

const LANG_KEY = "dzhealth-lang";

export function applyDir(lang: AppLang) {
  if (typeof document === "undefined") return;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

function cachedLang(): AppLang {
  if (typeof localStorage === "undefined") return "ar";
  const v = localStorage.getItem(LANG_KEY) as AppLang | null;
  return v === "fr" || v === "en" || v === "ar" ? v : "ar";
}

if (!i18n.isInitialized) {
  const lng = cachedLang();
  i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: "ar",
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  applyDir(lng);
}

/** Apply a language locally (i18n + <html dir/lang> + cache). */
function applyLocal(lang: AppLang) {
  if (typeof localStorage !== "undefined") localStorage.setItem(LANG_KEY, lang);
  applyDir(lang);
  return i18n.changeLanguage(lang);
}

/**
 * Persist the user's language preference.
 * Writes to the cloud datastore (profiles.language) when signed in,
 * and always mirrors to local cache so the choice survives reopen.
 */
export async function setAppLanguage(lang: AppLang) {
  await applyLocal(lang);
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (uid) {
      await supabase.from("profiles").update({ language: lang }).eq("user_id", uid);
    }
  } catch {
    /* offline / not signed in — local cache is enough */
  }
}

/**
 * Hydrate language from the cloud datastore for the signed-in user.
 * Call once after auth is known; falls back silently if unavailable.
 */
export async function hydrateLanguageFromCloud() {
  try {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return;
    const { data: p } = await supabase
      .from("profiles")
      .select("language")
      .eq("user_id", uid)
      .maybeSingle();
    const remote = p?.language as AppLang | undefined;
    if (remote && remote !== i18n.language && (remote === "ar" || remote === "fr" || remote === "en")) {
      await applyLocal(remote);
    }
  } catch {
    /* ignore */
  }
}

export default i18n;

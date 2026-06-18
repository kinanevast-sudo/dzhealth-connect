// Centralized config for admin CRUD resources.
// Each resource describes how to list, search, edit and display rows.

export type FieldType = "text" | "textarea" | "number" | "boolean" | "select";

export interface FieldDef {
  key: string;
  label: { ar: string; fr: string; en: string };
  type: FieldType;
  required?: boolean;
  options?: { value: string | number; label: string }[];
  /** lookup table for select (id => name) */
  lookup?: "wilayas" | "baladiyas" | "specialties";
}

export interface ResourceDef {
  /** url slug under /manage */
  slug: string;
  /** supabase table name */
  table: string;
  label: { ar: string; fr: string; en: string };
  /** columns shown in list view (max ~5) */
  list: { key: string; label: { ar: string; fr: string; en: string } }[];
  /** fields editable in drawer */
  fields: FieldDef[];
  /** columns text-searched with ilike */
  searchable: string[];
  /** order by column desc */
  orderBy: string;
  /** column representing the primary key */
  pk?: string;
}

const L = (ar: string, fr: string, en: string) => ({ ar, fr, en });

export const RESOURCES: ResourceDef[] = [
  {
    slug: "doctors", table: "doctors", label: L("الأطباء", "Médecins", "Doctors"),
    list: [
      { key: "full_name", label: L("الاسم", "Nom", "Name") },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone") },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya") },
      { key: "fee", label: L("السعر", "Tarif", "Fee") },
      { key: "verified", label: L("موثّق", "Vérifié", "Verified") },
    ],
    fields: [
      { key: "full_name", label: L("الاسم", "Nom", "Name"), type: "text", required: true },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone"), type: "text" },
      { key: "address", label: L("العنوان", "Adresse", "Address"), type: "text" },
      { key: "about", label: L("نبذة", "À propos", "About"), type: "textarea" },
      { key: "fee", label: L("السعر (دج)", "Tarif (DA)", "Fee (DZD)"), type: "number" },
      { key: "experience_years", label: L("الخبرة (سنوات)", "Expérience (ans)", "Experience (yrs)"), type: "number" },
      { key: "specialty_id", label: L("التخصص", "Spécialité", "Specialty"), type: "select", lookup: "specialties" },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya"), type: "select", lookup: "wilayas" },
      { key: "baladiya_id", label: L("البلدية", "Commune", "Baladiya"), type: "select", lookup: "baladiyas" },
      { key: "verified", label: L("موثّق", "Vérifié", "Verified"), type: "boolean" },
    ],
    searchable: ["full_name", "phone", "address"],
    orderBy: "created_at",
  },
  {
    slug: "hospitals", table: "hospitals", label: L("المستشفيات", "Hôpitaux", "Hospitals"),
    list: [
      { key: "name", label: L("الاسم", "Nom", "Name") },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone") },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya") },
      { key: "verified", label: L("موثّق", "Vérifié", "Verified") },
    ],
    fields: [
      { key: "name", label: L("الاسم", "Nom", "Name"), type: "text", required: true },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone"), type: "text" },
      { key: "address", label: L("العنوان", "Adresse", "Address"), type: "text" },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya"), type: "select", lookup: "wilayas" },
      { key: "baladiya_id", label: L("البلدية", "Commune", "Baladiya"), type: "select", lookup: "baladiyas" },
      { key: "verified", label: L("موثّق", "Vérifié", "Verified"), type: "boolean" },
    ],
    searchable: ["name", "phone", "address"],
    orderBy: "created_at",
  },
  {
    slug: "pharmacies", table: "pharmacies", label: L("الصيدليات", "Pharmacies", "Pharmacies"),
    list: [
      { key: "name", label: L("الاسم", "Nom", "Name") },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone") },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya") },
      { key: "verified", label: L("موثّق", "Vérifié", "Verified") },
    ],
    fields: [
      { key: "name", label: L("الاسم", "Nom", "Name"), type: "text", required: true },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone"), type: "text" },
      { key: "address", label: L("العنوان", "Adresse", "Address"), type: "text" },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya"), type: "select", lookup: "wilayas" },
      { key: "baladiya_id", label: L("البلدية", "Commune", "Baladiya"), type: "select", lookup: "baladiyas" },
      { key: "verified", label: L("موثّق", "Vérifié", "Verified"), type: "boolean" },
    ],
    searchable: ["name", "phone", "address"],
    orderBy: "created_at",
  },
  {
    slug: "pharmacy_on_call", table: "pharmacy_on_call", label: L("الصيدليات المناوبة", "Pharmacies de garde", "On-call pharmacies"),
    list: [
      { key: "pharmacy_id", label: L("الصيدلية", "Pharmacie", "Pharmacy") },
      { key: "date", label: L("التاريخ", "Date", "Date") },
    ],
    fields: [
      { key: "pharmacy_id", label: L("معرّف الصيدلية", "ID Pharmacie", "Pharmacy ID"), type: "text", required: true },
      { key: "date", label: L("التاريخ", "Date", "Date"), type: "text", required: true },
    ],
    searchable: [],
    orderBy: "date",
  },
  {
    slug: "blood_donors", table: "blood_donors", label: L("متبرعو الدم", "Donneurs de sang", "Blood donors"),
    list: [
      { key: "full_name", label: L("الاسم", "Nom", "Name") },
      { key: "blood_type", label: L("الفصيلة", "Groupe", "Type") },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone") },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya") },
    ],
    fields: [
      { key: "full_name", label: L("الاسم", "Nom", "Name"), type: "text", required: true },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone"), type: "text" },
      { key: "blood_type", label: L("الفصيلة", "Groupe sanguin", "Blood type"), type: "select", options: [
        { value: "O+", label: "O+" }, { value: "O-", label: "O-" }, { value: "A+", label: "A+" }, { value: "A-", label: "A-" },
        { value: "B+", label: "B+" }, { value: "B-", label: "B-" }, { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" },
      ] },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya"), type: "select", lookup: "wilayas" },
      { key: "baladiya_id", label: L("البلدية", "Commune", "Baladiya"), type: "select", lookup: "baladiyas" },
    ],
    searchable: ["full_name", "phone"],
    orderBy: "created_at",
  },
  {
    slug: "blood_requests", table: "blood_requests", label: L("طلبات الدم", "Demandes de sang", "Blood requests"),
    list: [
      { key: "blood_type", label: L("الفصيلة", "Groupe", "Type") },
      { key: "units_needed", label: L("الوحدات", "Unités", "Units") },
      { key: "urgency", label: L("الأولوية", "Urgence", "Urgency") },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya") },
      { key: "status", label: L("الحالة", "Statut", "Status") },
    ],
    fields: [
      { key: "blood_type", label: L("الفصيلة", "Groupe sanguin", "Blood type"), type: "text", required: true },
      { key: "units_needed", label: L("الوحدات", "Unités", "Units"), type: "number", required: true },
      { key: "urgency", label: L("الأولوية", "Urgence", "Urgency"), type: "select", options: [
        { value: "normal", label: "normal" }, { value: "urgent", label: "urgent" }, { value: "critical", label: "critical" },
      ] },
      { key: "hospital_name", label: L("المستشفى", "Hôpital", "Hospital"), type: "text" },
      { key: "contact_phone", label: L("الهاتف", "Téléphone", "Phone"), type: "text" },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya"), type: "select", lookup: "wilayas" },
      { key: "baladiya_id", label: L("البلدية", "Commune", "Baladiya"), type: "select", lookup: "baladiyas" },
      { key: "status", label: L("الحالة", "Statut", "Status"), type: "select", options: [
        { value: "open", label: "open" }, { value: "closed", label: "closed" },
      ] },
    ],
    searchable: ["hospital_name", "contact_phone"],
    orderBy: "created_at",
  },
  {
    slug: "equipment", table: "equipment", label: L("التجهيزات الطبية", "Équipements", "Equipment"),
    list: [
      { key: "name", label: L("الاسم", "Nom", "Name") },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone") },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya") },
    ],
    fields: [
      { key: "name", label: L("الاسم", "Nom", "Name"), type: "text", required: true },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone"), type: "text" },
      { key: "address", label: L("العنوان", "Adresse", "Address"), type: "text" },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya"), type: "select", lookup: "wilayas" },
      { key: "baladiya_id", label: L("البلدية", "Commune", "Baladiya"), type: "select", lookup: "baladiyas" },
    ],
    searchable: ["name", "phone", "address"],
    orderBy: "created_at",
  },
  {
    slug: "ambulances", table: "ambulances", label: L("سيارات الإسعاف", "Ambulances", "Ambulances"),
    list: [
      { key: "name", label: L("الاسم", "Nom", "Name") },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone") },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya") },
      { key: "is_24_7", label: L("24/7", "24/7", "24/7") },
    ],
    fields: [
      { key: "name", label: L("الاسم", "Nom", "Name"), type: "text", required: true },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone"), type: "text" },
      { key: "coverage_area", label: L("المنطقة", "Zone", "Coverage"), type: "text" },
      { key: "is_24_7", label: L("متاح 24/7", "Dispo 24/7", "Available 24/7"), type: "boolean" },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya"), type: "select", lookup: "wilayas" },
      { key: "baladiya_id", label: L("البلدية", "Commune", "Baladiya"), type: "select", lookup: "baladiyas" },
      { key: "verified", label: L("موثّق", "Vérifié", "Verified"), type: "boolean" },
    ],
    searchable: ["name", "phone", "coverage_area"],
    orderBy: "created_at",
  },
  {
    slug: "civil_protection_centers", table: "civil_protection_centers",
    label: L("الحماية المدنية", "Protection civile", "Civil protection"),
    list: [
      { key: "name", label: L("الاسم", "Nom", "Name") },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone") },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya") },
    ],
    fields: [
      { key: "name", label: L("الاسم", "Nom", "Name"), type: "text", required: true },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone"), type: "text" },
      { key: "address", label: L("العنوان", "Adresse", "Address"), type: "text" },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya"), type: "select", lookup: "wilayas" },
      { key: "baladiya_id", label: L("البلدية", "Commune", "Baladiya"), type: "select", lookup: "baladiyas" },
    ],
    searchable: ["name", "phone", "address"],
    orderBy: "created_at",
  },
  {
    slug: "charities", table: "charities", label: L("الجمعيات الخيرية", "Associations", "Charities"),
    list: [
      { key: "name", label: L("الاسم", "Nom", "Name") },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone") },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya") },
    ],
    fields: [
      { key: "name", label: L("الاسم", "Nom", "Name"), type: "text", required: true },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone"), type: "text" },
      { key: "address", label: L("العنوان", "Adresse", "Address"), type: "text" },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya"), type: "select", lookup: "wilayas" },
      { key: "baladiya_id", label: L("البلدية", "Commune", "Baladiya"), type: "select", lookup: "baladiyas" },
    ],
    searchable: ["name", "phone", "address"],
    orderBy: "created_at",
  },
  {
    slug: "labs", table: "labs", label: L("المخابر", "Laboratoires", "Labs"),
    list: [
      { key: "name", label: L("الاسم", "Nom", "Name") },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone") },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya") },
    ],
    fields: [
      { key: "name", label: L("الاسم", "Nom", "Name"), type: "text", required: true },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone"), type: "text" },
      { key: "address", label: L("العنوان", "Adresse", "Address"), type: "text" },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya"), type: "select", lookup: "wilayas" },
      { key: "baladiya_id", label: L("البلدية", "Commune", "Baladiya"), type: "select", lookup: "baladiyas" },
    ],
    searchable: ["name", "phone", "address"],
    orderBy: "created_at",
  },
  {
    slug: "specialties", table: "specialties", label: L("التخصصات", "Spécialités", "Specialties"),
    list: [
      { key: "id", label: L("الرقم", "ID", "ID") },
      { key: "name_ar", label: L("بالعربية", "Arabe", "Arabic") },
      { key: "name_fr", label: L("بالفرنسية", "Français", "French") },
      { key: "name_en", label: L("بالإنجليزية", "Anglais", "English") },
    ],
    fields: [
      { key: "name_ar", label: L("الاسم بالعربية", "Nom AR", "Arabic name"), type: "text", required: true },
      { key: "name_fr", label: L("الاسم بالفرنسية", "Nom FR", "French name"), type: "text", required: true },
      { key: "name_en", label: L("الاسم بالإنجليزية", "Nom EN", "English name"), type: "text", required: true },
    ],
    searchable: ["name_ar", "name_fr", "name_en"],
    orderBy: "id",
  },
  {
    slug: "notifications", table: "notifications", label: L("الإشعارات", "Notifications", "Notifications"),
    list: [
      { key: "title", label: L("العنوان", "Titre", "Title") },
      { key: "kind", label: L("النوع", "Type", "Kind") },
      { key: "user_id", label: L("المستخدم", "Utilisateur", "User") },
    ],
    fields: [
      { key: "user_id", label: L("معرّف المستخدم", "ID utilisateur", "User ID"), type: "text", required: true },
      { key: "title", label: L("العنوان", "Titre", "Title"), type: "text", required: true },
      { key: "body", label: L("النص", "Contenu", "Body"), type: "textarea" },
      { key: "kind", label: L("النوع", "Type", "Kind"), type: "text" },
    ],
    searchable: ["title", "body"],
    orderBy: "created_at",
  },
  {
    slug: "appointments", table: "appointments", label: L("المواعيد", "Rendez-vous", "Appointments"),
    list: [
      { key: "doctor_id", label: L("الطبيب", "Médecin", "Doctor") },
      { key: "user_id", label: L("المستخدم", "Utilisateur", "User") },
      { key: "scheduled_at", label: L("التاريخ", "Date", "Date") },
      { key: "status", label: L("الحالة", "Statut", "Status") },
    ],
    fields: [
      { key: "status", label: L("الحالة", "Statut", "Status"), type: "select", options: [
        { value: "pending", label: "pending" }, { value: "confirmed", label: "confirmed" },
        { value: "cancelled", label: "cancelled" }, { value: "completed", label: "completed" },
      ] },
      { key: "notes", label: L("ملاحظات", "Notes", "Notes"), type: "textarea" },
    ],
    searchable: [],
    orderBy: "scheduled_at",
  },
  {
    slug: "profiles", table: "profiles", label: L("الملفات الشخصية", "Profils", "Profiles"),
    list: [
      { key: "full_name", label: L("الاسم", "Nom", "Name") },
      { key: "email", label: L("البريد", "Email", "Email") },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone") },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya") },
    ],
    fields: [
      { key: "full_name", label: L("الاسم", "Nom", "Name"), type: "text" },
      { key: "phone", label: L("الهاتف", "Téléphone", "Phone"), type: "text" },
      { key: "wilaya_id", label: L("الولاية", "Wilaya", "Wilaya"), type: "select", lookup: "wilayas" },
      { key: "baladiya_id", label: L("البلدية", "Commune", "Baladiya"), type: "select", lookup: "baladiyas" },
    ],
    searchable: ["full_name", "email", "phone"],
    orderBy: "created_at",
    pk: "user_id",
  },
];

export function getResource(slug: string): ResourceDef | undefined {
  return RESOURCES.find((r) => r.slug === slug);
}

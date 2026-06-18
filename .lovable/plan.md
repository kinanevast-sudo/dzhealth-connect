
# خطة لوحة إدارة DZHealth (`/manage`)

## ملاحظة هامة حول التقنيات

طلبك يذكر **Node.js + Express + Prisma + Redis + Bull + Next.js منفصل + Socket.io + Firebase Push**. هذه التقنيات **غير مدعومة على منصة Lovable** (التي تشغّل TanStack Start على Cloudflare Workers + Supabase). لكن جميع الأهداف الوظيفية قابلة للتحقيق بمكافئات مدعومة بالكامل:

| المطلوب | البديل المعتمد | نفس النتيجة؟ |
|---|---|---|
| Express REST API | TanStack Server Functions + Server Routes تحت `/api/*` | ✅ |
| Prisma ORM | Supabase Client مع Types مولّدة + RLS | ✅ |
| Socket.io Realtime | Supabase Realtime Channels | ✅ |
| Redis Cache | TanStack Query + Materialized Views للإحصائيات | ✅ |
| Bull Queues | `pg_cron` + جداول مهام في Postgres | ✅ |
| Next.js منفصل | مسار `/manage/*` داخل نفس المشروع مع code-splitting (لا يُحمَّل للمستخدم العادي) | ✅ |
| Firebase Push | إشعارات داخل التطبيق عبر `notifications` + Realtime (Push لاحقاً عبر FCM إن أردت) | ✅ جزئياً |

**الفصل المنطقي مضمون**: لوحة `/manage` تُبنى تحت `_authenticated/manage/` مع حماية بدور المشرف، وكل صفحاتها lazy-loaded فلا تؤثر على حجم/سرعة باندل التطبيق العادي.

---

## المرحلة 1 — الأساس الأمني + نظام المراجعة (الأولوية القصوى)

### Migration واحد (لا يلمس أي جدول موجود):
- enum `app_role`: `super_admin`, `admin`, `moderator`
- جدول `user_roles` + دالة `has_role()` security-definer + دالة `is_admin()` لاختصار الفحص
- جدول `pending_submissions`: id, content_type, payload jsonb, images text[], lat, lng, status (pending/approved/rejected/edited), priority, rejection_reason, internal_notes, submitter_id, reviewer_id, reviewed_at, ip, user_agent
- جدول `admin_actions_log`: actor_id, action, target_type, target_id, old_data jsonb, new_data jsonb, reason, ip, created_at
- جدول `content_moderation_history`: submission_id, action, reviewer_id, before/after jsonb, notes
- RLS صارم: المشرفون يقرؤون/يعدّلون كل شيء؛ صاحب الطلب يرى طلباته فقط
- GRANTs كاملة لكل جدول
- ترقية أول حساب إلى `super_admin` (سأطلب البريد منك)

### الواجهة:
- `src/routes/_authenticated/manage/route.tsx`: gate يتحقق من `is_admin` ويعيد توجيه غير المخوّلين إلى `/home`
- Sidebar shadcn مخصص للوحة، مستقل عن `AppShell` الحالي (التطبيق الحالي لا يتغير)
- صفحة Dashboard فارغة `/manage` بـ KPI placeholders
- صفحة `/manage/submissions`: قائمة الإضافات المعلقة + معاينة صور + خريطة موقع + أزرار **قبول / رفض مع سبب / تعديل ثم قبول**
- Server functions لنقل البيانات تلقائياً من `pending_submissions` إلى الجدول الهدف عند القبول، مع تسجيل في `admin_actions_log` وإشعار المستخدم تلقائياً عبر `notifications`
- ترجمة كاملة ar/fr/en مع RTL

---

## المرحلة 2 — وحدات إدارة الموارد (CRUD)

لكل جدول موجود (`doctors, hospitals, pharmacies, pharmacy_on_call, blood_donors, equipment, ambulances, civil_protection_centers, charities, labs, appointments, doctor_reviews, reviews, notifications, profiles, specialties, wilayas, baladiyas`):
- صفحة `/manage/<resource>` مع `AdminDataTable` موحّد: بحث، فرز، فلترة (ولاية/بلدية/حالة)، صفحات server-side
- Drawer للإنشاء/التعديل + حذف ناعم (أو `is_active`)
- تصدير CSV/Excel من العرض الحالي
- استيراد CSV (للولايات/البلديات/التخصصات)
- رفع صور إلى buckets الحالية `places`/`avatars`
- جداول جديدة: `user_reports` (شكاوى), `media_files_management`

كل عملية تُسجَّل في `admin_actions_log`.

---

## المرحلة 3 — لوحة الإحصائيات الأساسية

- KPI Cards مع Supabase Realtime: إجماليات + المستخدمون/الإضافات الجدد (اليوم/الأسبوع/الشهر)
- رسوم Recharts: توزيع الأطباء بالولاية/التخصص، تطور المواعيد، توزيع فصائل الدم، أعلى الصيدليات المناوبة
- فلاتر شاملة (ولاية/بلدية/تاريخ)
- التجميعات عبر SQL Views + RPC للأداء، تُستدعى من server functions محمية بدور المشرف
- تصدير التقارير: CSV / Excel / PDF / PNG

---

## المرحلة 4 — التحليلات المتقدمة + الخرائط + AI

### جداول جديدة:
- `admin_user_analytics`, `search_logs`, `system_monitoring_logs`, `notifications_delivery_log`, `system_cache_analytics`, `health_coverage_index`, `ai_recommendations`

### المميزات:
- تتبع جلسات وصفحات (instrumentation خفيف في التطبيق)
- مؤشر التغطية الصحية لكل ولاية/بلدية (محسوب عبر `pg_cron` يومياً ومخزّن في `health_coverage_index`)
- تحليل النقص الطبي: تخصصات نادرة، مناطق محرومة
- **خريطة Leaflet تفاعلية** `/manage/map`: نقاط الخدمات + طبقة حرارية للنشاط + تلوين الولايات حسب مؤشر التغطية
- **توصيات Lovable AI** (موديل `google/gemini-3-flash-preview`): تقرأ ملخصات الإحصائيات وترجع أولويات تطوير، تنبيهات بيانات مكررة/ناقصة، توقّع طلب التخصصات
- مراقبة النظام: تسجيل أخطاء + زمن الاستجابة في `system_monitoring_logs`
- إرسال إشعارات مجدولة عبر `pg_cron` + جدول مهام

---

## المرحلة 5 — صلاحيات دقيقة + PWA + Push (اختياري)

- نظام permissions على مستوى العملية (مثل `doctors.approve`, `notifications.send`) في جدول `role_permissions`
- 2FA للمشرفين (TOTP) + IP whitelist اختياري
- جلسات قصيرة + Logout تلقائي بعد خمول
- PWA Manifest + Service Worker للوحة فقط (التطبيق العام يبقى كما هو)
- إن أردت Push حقيقي: تكامل FCM لاحقاً (يتطلب مفاتيح Firebase منك)

---

## الضمانات (مطابقة لقيودك)

- ❌ لا حذف ولا تعديل لأي جدول/عمود/وظيفة موجودة
- ❌ لا تعديل على أي مسار من مسارات التطبيق الحالي
- ✅ فقط جداول وأعمدة جديدة، وكلها معزولة
- ✅ لوحة `/manage` lazy-loaded → التطبيق العادي لا يتأثر حجمه ولا سرعته
- ✅ RLS مفعّل على كل جدول جديد + GRANTs صريحة
- ✅ كل قرار إداري مُسجَّل في `admin_actions_log`

---

## ما سأنفّذه أولاً عند الموافقة

**المرحلة 1 فقط** (قابلة للاستخدام مباشرة بعد التنفيذ):
1. Migration: الأدوار + `pending_submissions` + `admin_actions_log` + `content_moderation_history` + RLS + GRANTs
2. مسار `_authenticated/manage` + Sidebar + Dashboard أولي
3. صفحة `/manage/submissions` كاملة مع قبول/رفض/تعديل + نقل تلقائي + إشعار المستخدم
4. ترجمة كاملة ar/fr/en
5. ترقية حساب أول `super_admin`

ثم نختبر معاً وننتقل للمرحلة 2.

---

## أحتاج منك إجابة سؤالين قبل البدء

1. **بريد الحساب الذي تريده `super_admin` أول مرة؟** (سيتم ترقيته في الـ migration)
2. **أي نوع من الإضافات الموجودة حالياً في تطبيقك تريد أن يمرّ عبر نظام المراجعة `pending_submissions`؟** (مثلاً: إضافة طبيب، صيدلية، متبرع دم، طلب دم… كل الإضافات أم بعضها فقط؟)

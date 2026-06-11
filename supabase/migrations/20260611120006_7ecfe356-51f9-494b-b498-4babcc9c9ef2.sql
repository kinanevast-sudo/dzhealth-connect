
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TYPE public.blood_type AS ENUM ('O+','O-','A+','A-','B+','B-','AB+','AB-');
CREATE TYPE public.appointment_status AS ENUM ('pending','confirmed','completed','cancelled');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- WILAYAS
CREATE TABLE public.wilayas (
  id SMALLINT PRIMARY KEY,
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL
);
GRANT SELECT ON public.wilayas TO anon, authenticated;
GRANT ALL ON public.wilayas TO service_role;
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wilayas readable" ON public.wilayas FOR SELECT USING (true);

-- BALADIYAS
CREATE TABLE public.baladiyas (
  id SERIAL PRIMARY KEY,
  wilaya_id SMALLINT NOT NULL REFERENCES public.wilayas(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL
);
CREATE INDEX idx_baladiyas_wilaya ON public.baladiyas(wilaya_id);
GRANT SELECT ON public.baladiyas TO anon, authenticated;
GRANT ALL ON public.baladiyas TO service_role;
ALTER TABLE public.baladiyas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "baladiyas readable" ON public.baladiyas FOR SELECT USING (true);

-- SPECIALTIES
CREATE TABLE public.specialties (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT
);
GRANT SELECT ON public.specialties TO anon, authenticated;
GRANT ALL ON public.specialties TO service_role;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specialties readable" ON public.specialties FOR SELECT USING (true);

-- PROFILES
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  blood_type public.blood_type,
  wilaya_id SMALLINT REFERENCES public.wilayas(id),
  baladiya_id INT REFERENCES public.baladiyas(id),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  language TEXT NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

-- DOCTORS
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  specialty_id INT REFERENCES public.specialties(id),
  photo_url TEXT,
  wilaya_id SMALLINT REFERENCES public.wilayas(id),
  baladiya_id INT REFERENCES public.baladiyas(id),
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  fee INT,
  rating NUMERIC(2,1) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  experience_years INT,
  patients_count INT,
  satisfaction INT,
  about TEXT,
  verified BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.doctors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctors readable" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "doctors auth insert" ON public.doctors FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "doctors creator update" ON public.doctors FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "doctors creator delete" ON public.doctors FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_doctors_updated BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- HOSPITALS
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind TEXT,
  wilaya_id SMALLINT REFERENCES public.wilayas(id),
  baladiya_id INT REFERENCES public.baladiyas(id),
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  photo_url TEXT,
  rating NUMERIC(2,1) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hospitals TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hospitals TO authenticated;
GRANT ALL ON public.hospitals TO service_role;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hospitals readable" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "hospitals auth insert" ON public.hospitals FOR INSERT TO authenticated WITH CHECK (auth.uid()=created_by);
CREATE POLICY "hospitals creator mutate" ON public.hospitals FOR UPDATE TO authenticated USING (auth.uid()=created_by OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_hospitals_updated BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- PHARMACIES
CREATE TABLE public.pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_24_7 BOOLEAN DEFAULT false,
  open_until TIME,
  wilaya_id SMALLINT REFERENCES public.wilayas(id),
  baladiya_id INT REFERENCES public.baladiyas(id),
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pharmacies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pharmacies TO authenticated;
GRANT ALL ON public.pharmacies TO service_role;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pharm readable" ON public.pharmacies FOR SELECT USING (true);
CREATE POLICY "pharm auth insert" ON public.pharmacies FOR INSERT TO authenticated WITH CHECK (auth.uid()=created_by);
CREATE POLICY "pharm creator mutate" ON public.pharmacies FOR UPDATE TO authenticated USING (auth.uid()=created_by OR public.has_role(auth.uid(),'admin'));

-- BLOOD DONORS
CREATE TABLE public.blood_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  blood_type public.blood_type NOT NULL,
  wilaya_id SMALLINT REFERENCES public.wilayas(id),
  baladiya_id INT REFERENCES public.baladiyas(id),
  address TEXT,
  phone TEXT,
  available BOOLEAN DEFAULT true,
  emergency BOOLEAN DEFAULT false,
  photo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blood_donors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blood_donors TO authenticated;
GRANT ALL ON public.blood_donors TO service_role;
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donors readable" ON public.blood_donors FOR SELECT USING (true);
CREATE POLICY "donors auth insert" ON public.blood_donors FOR INSERT TO authenticated WITH CHECK (auth.uid()=created_by);
CREATE POLICY "donors creator mutate" ON public.blood_donors FOR UPDATE TO authenticated USING (auth.uid()=created_by OR public.has_role(auth.uid(),'admin'));

-- EQUIPMENT
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind TEXT,
  condition TEXT,
  wilaya_id SMALLINT REFERENCES public.wilayas(id),
  baladiya_id INT REFERENCES public.baladiyas(id),
  phone TEXT,
  photo_url TEXT,
  available BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.equipment TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.equipment TO authenticated;
GRANT ALL ON public.equipment TO service_role;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equip readable" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "equip auth insert" ON public.equipment FOR INSERT TO authenticated WITH CHECK (auth.uid()=created_by);
CREATE POLICY "equip creator mutate" ON public.equipment FOR UPDATE TO authenticated USING (auth.uid()=created_by OR public.has_role(auth.uid(),'admin'));

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  visit_type TEXT DEFAULT 'in_person',
  status public.appointment_status NOT NULL DEFAULT 'pending',
  fee INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appts self" ON public.appointments FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT DEFAULT 'system',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif self" ON public.notifications FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

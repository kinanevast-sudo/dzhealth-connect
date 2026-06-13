
-- 1) Notification preferences on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_blood_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_blood_match_only boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_blood_critical_same_baladiya boolean NOT NULL DEFAULT true;

-- 2) Urgency enum
DO $$ BEGIN
  CREATE TYPE public.blood_urgency AS ENUM ('normal','urgent','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.blood_request_status AS ENUM ('open','fulfilled','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) blood_requests
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name text,
  blood_type public.blood_type NOT NULL,
  units_needed smallint NOT NULL DEFAULT 1 CHECK (units_needed > 0 AND units_needed < 50),
  urgency public.blood_urgency NOT NULL DEFAULT 'urgent',
  hospital_name text,
  wilaya_id smallint REFERENCES public.wilayas(id),
  baladiya_id integer REFERENCES public.baladiyas(id),
  contact_phone text NOT NULL,
  notes text,
  status public.blood_request_status NOT NULL DEFAULT 'open',
  needed_by timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_requests TO authenticated;
GRANT ALL ON public.blood_requests TO service_role;

ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blood_requests_select_authenticated" ON public.blood_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "blood_requests_insert_own" ON public.blood_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "blood_requests_update_own" ON public.blood_requests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "blood_requests_delete_own" ON public.blood_requests
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER blood_requests_set_updated_at
  BEFORE UPDATE ON public.blood_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_blood_requests_wilaya ON public.blood_requests(wilaya_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_requests_user ON public.blood_requests(user_id);

-- 4) Compatibility helper: donors compatible to give to a given recipient blood type
CREATE OR REPLACE FUNCTION public.compatible_donor_types(_recipient public.blood_type)
RETURNS public.blood_type[]
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _recipient
    WHEN 'O+'::public.blood_type  THEN ARRAY['O+','O-']::public.blood_type[]
    WHEN 'O-'::public.blood_type  THEN ARRAY['O-']::public.blood_type[]
    WHEN 'A+'::public.blood_type  THEN ARRAY['A+','A-','O+','O-']::public.blood_type[]
    WHEN 'A-'::public.blood_type  THEN ARRAY['A-','O-']::public.blood_type[]
    WHEN 'B+'::public.blood_type  THEN ARRAY['B+','B-','O+','O-']::public.blood_type[]
    WHEN 'B-'::public.blood_type  THEN ARRAY['B-','O-']::public.blood_type[]
    WHEN 'AB+'::public.blood_type THEN ARRAY['A+','A-','B+','B-','O+','O-','AB+','AB-']::public.blood_type[]
    WHEN 'AB-'::public.blood_type THEN ARRAY['A-','B-','O-','AB-']::public.blood_type[]
  END
$$;

-- 5) Fan-out trigger: notify matching users
CREATE OR REPLACE FUNCTION public.tg_blood_request_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  compat public.blood_type[];
  urgency_label text;
BEGIN
  compat := public.compatible_donor_types(NEW.blood_type);
  urgency_label := CASE NEW.urgency
    WHEN 'critical' THEN 'حالة حرجة'
    WHEN 'urgent'   THEN 'طلب عاجل'
    ELSE 'طلب دم'
  END;

  INSERT INTO public.notifications (user_id, title, body, kind)
  SELECT
    p.user_id,
    urgency_label || ' - ' || NEW.blood_type::text,
    'حاجة لـ ' || NEW.units_needed || ' وحدة (' || NEW.blood_type::text || ')'
      || COALESCE(' في ' || NEW.hospital_name, '')
      || COALESCE(' - ' || (SELECT name_ar FROM public.wilayas WHERE id = NEW.wilaya_id), ''),
    'blood'
  FROM public.profiles p
  WHERE p.user_id <> NEW.user_id
    AND COALESCE(p.notify_blood_enabled, true) = true
    AND (
      -- match by compatibility if user opted in, else any blood notification
      (COALESCE(p.notify_blood_match_only, true) = false)
      OR (p.blood_type IS NOT NULL AND p.blood_type = ANY(compat))
    )
    AND (
      -- same wilaya for normal/urgent
      (NEW.urgency IN ('normal','urgent') AND p.wilaya_id = NEW.wilaya_id)
      OR
      -- critical: same wilaya always, plus prioritize same baladiya users who opted in
      (NEW.urgency = 'critical' AND (
        p.wilaya_id = NEW.wilaya_id
        OR (COALESCE(p.notify_blood_critical_same_baladiya, true) = true AND p.baladiya_id = NEW.baladiya_id)
      ))
    );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS blood_requests_notify ON public.blood_requests;
CREATE TRIGGER blood_requests_notify
  AFTER INSERT ON public.blood_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_blood_request_notify();

-- 6) Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_requests;

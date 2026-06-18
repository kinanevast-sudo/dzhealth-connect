
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('super_admin','admin','moderator')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'super_admin')
$$;

CREATE TABLE public.pending_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  images text[] NOT NULL DEFAULT '{}',
  lat double precision,
  lng double precision,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','edited')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  rejection_reason text,
  internal_notes text,
  submitter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  approved_target_id uuid,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pending_submissions_status ON public.pending_submissions(status, created_at DESC);
CREATE INDEX idx_pending_submissions_type ON public.pending_submissions(content_type, status);
CREATE INDEX idx_pending_submissions_submitter ON public.pending_submissions(submitter_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_submissions TO authenticated;
GRANT ALL ON public.pending_submissions TO service_role;
ALTER TABLE public.pending_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submitter can insert own submission"
  ON public.pending_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = submitter_id);
CREATE POLICY "submitter can view own submission"
  ON public.pending_submissions FOR SELECT TO authenticated
  USING (auth.uid() = submitter_id OR public.is_admin(auth.uid()));
CREATE POLICY "admins can update submissions"
  ON public.pending_submissions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "super_admin can delete submissions"
  ON public.pending_submissions FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_pending_submissions_updated_at
  BEFORE UPDATE ON public.pending_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.admin_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  old_data jsonb,
  new_data jsonb,
  reason text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_actions_actor ON public.admin_actions_log(actor_id, created_at DESC);
CREATE INDEX idx_admin_actions_target ON public.admin_actions_log(target_type, target_id);

GRANT SELECT, INSERT ON public.admin_actions_log TO authenticated;
GRANT ALL ON public.admin_actions_log TO service_role;
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can read action log"
  ON public.admin_actions_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "admins can insert action log"
  ON public.admin_actions_log FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = actor_id);

CREATE TABLE public.content_moderation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.pending_submissions(id) ON DELETE CASCADE,
  action text NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  before_data jsonb,
  after_data jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_moderation_history_submission ON public.content_moderation_history(submission_id, created_at DESC);

GRANT SELECT, INSERT ON public.content_moderation_history TO authenticated;
GRANT ALL ON public.content_moderation_history TO service_role;
ALTER TABLE public.content_moderation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read moderation history"
  ON public.content_moderation_history FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "admins write moderation history"
  ON public.content_moderation_history FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = reviewer_id);

CREATE OR REPLACE FUNCTION public.claim_super_admin_bootstrap()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  exists_super boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role::text = 'super_admin') INTO exists_super;
  IF exists_super THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'super_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.claim_super_admin_bootstrap() TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_submission(_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  sub public.pending_submissions;
BEGIN
  IF NOT public.is_admin(uid) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO sub FROM public.pending_submissions WHERE id = _id FOR UPDATE;
  IF sub.id IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  IF sub.status <> 'pending' THEN RAISE EXCEPTION 'already processed'; END IF;
  UPDATE public.pending_submissions
    SET status='rejected', rejection_reason=_reason, reviewer_id=uid, reviewed_at=now()
    WHERE id=_id;
  INSERT INTO public.content_moderation_history(submission_id, action, reviewer_id, before_data, notes)
    VALUES (_id, 'rejected', uid, to_jsonb(sub), _reason);
  INSERT INTO public.admin_actions_log(actor_id, action, target_type, target_id, reason)
    VALUES (uid, 'reject', 'pending_submission', _id::text, _reason);
  IF sub.submitter_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, title, body, kind)
    VALUES (sub.submitter_id, 'تم رفض إضافتك',
            COALESCE('السبب: ' || _reason, 'تم رفض الإضافة من المشرف.'), 'system');
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.reject_submission(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_submission(_id uuid, _override_payload jsonb DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  sub public.pending_submissions;
  p jsonb;
  new_id uuid;
BEGIN
  IF NOT public.is_admin(uid) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO sub FROM public.pending_submissions WHERE id = _id FOR UPDATE;
  IF sub.id IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  IF sub.status <> 'pending' THEN RAISE EXCEPTION 'already processed'; END IF;
  p := COALESCE(_override_payload, sub.payload);

  CASE sub.content_type
    WHEN 'doctor' THEN
      INSERT INTO public.doctors(full_name, specialty_id, phone, address, fee, experience_years, about, wilaya_id, baladiya_id, lat, lng, photo_url, created_by)
      VALUES (p->>'full_name', NULLIF(p->>'specialty_id','')::int, p->>'phone', p->>'address',
              NULLIF(p->>'fee','')::numeric, NULLIF(p->>'experience_years','')::int, p->>'about',
              NULLIF(p->>'wilaya_id','')::int, NULLIF(p->>'baladiya_id','')::int,
              COALESCE(sub.lat, NULLIF(p->>'lat','')::float), COALESCE(sub.lng, NULLIF(p->>'lng','')::float),
              COALESCE(p->>'photo_url', (sub.images)[1]), sub.submitter_id)
      RETURNING id INTO new_id;
    WHEN 'pharmacy' THEN
      INSERT INTO public.pharmacies(name, phone, address, wilaya_id, baladiya_id, lat, lng, photo_url, created_by)
      VALUES (p->>'name', p->>'phone', p->>'address',
              NULLIF(p->>'wilaya_id','')::int, NULLIF(p->>'baladiya_id','')::int,
              COALESCE(sub.lat, NULLIF(p->>'lat','')::float), COALESCE(sub.lng, NULLIF(p->>'lng','')::float),
              COALESCE(p->>'photo_url', (sub.images)[1]), sub.submitter_id)
      RETURNING id INTO new_id;
    WHEN 'hospital' THEN
      INSERT INTO public.hospitals(name, phone, address, wilaya_id, baladiya_id, lat, lng, photo_url, created_by)
      VALUES (p->>'name', p->>'phone', p->>'address',
              NULLIF(p->>'wilaya_id','')::int, NULLIF(p->>'baladiya_id','')::int,
              COALESCE(sub.lat, NULLIF(p->>'lat','')::float), COALESCE(sub.lng, NULLIF(p->>'lng','')::float),
              COALESCE(p->>'photo_url', (sub.images)[1]), sub.submitter_id)
      RETURNING id INTO new_id;
    ELSE
      new_id := NULL;
  END CASE;

  UPDATE public.pending_submissions
    SET status='approved', reviewer_id=uid, reviewed_at=now(),
        approved_target_id=new_id,
        payload = CASE WHEN _override_payload IS NOT NULL THEN _override_payload ELSE payload END
    WHERE id=_id;

  INSERT INTO public.content_moderation_history(submission_id, action, reviewer_id, before_data, after_data)
    VALUES (_id, CASE WHEN _override_payload IS NOT NULL THEN 'edited_and_approved' ELSE 'approved' END,
            uid, to_jsonb(sub), p);
  INSERT INTO public.admin_actions_log(actor_id, action, target_type, target_id, new_data)
    VALUES (uid, 'approve', 'pending_submission', _id::text,
            jsonb_build_object('target_id', new_id, 'content_type', sub.content_type));

  IF sub.submitter_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, title, body, kind)
    VALUES (sub.submitter_id, 'تم قبول إضافتك', 'تمت الموافقة على إضافتك ونشرها.', 'system');
  END IF;
  RETURN new_id;
END $$;
GRANT EXECUTE ON FUNCTION public.approve_submission(uuid, jsonb) TO authenticated;

CREATE OR REPLACE VIEW public.admin_submission_stats AS
SELECT status, content_type, count(*)::int AS count
FROM public.pending_submissions
GROUP BY status, content_type;
GRANT SELECT ON public.admin_submission_stats TO authenticated;

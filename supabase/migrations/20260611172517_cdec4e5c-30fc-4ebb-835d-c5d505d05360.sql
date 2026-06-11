CREATE TABLE public.doctor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, user_id)
);
GRANT SELECT ON public.doctor_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_reviews TO authenticated;
GRANT ALL ON public.doctor_reviews TO service_role;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews readable" ON public.doctor_reviews FOR SELECT USING (true);
CREATE POLICY "reviews self insert" ON public.doctor_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews self update" ON public.doctor_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reviews self delete" ON public.doctor_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX doctor_reviews_doctor_idx ON public.doctor_reviews(doctor_id, created_at DESC);
CREATE TRIGGER trg_doctor_reviews_updated BEFORE UPDATE ON public.doctor_reviews FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
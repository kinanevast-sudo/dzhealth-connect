CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.civil_protection_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  wilaya_id INTEGER REFERENCES public.wilayas(id),
  baladiya_id INTEGER REFERENCES public.baladiyas(id),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.civil_protection_centers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.civil_protection_centers TO authenticated;
GRANT ALL ON public.civil_protection_centers TO service_role;

ALTER TABLE public.civil_protection_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view civil protection centers"
  ON public.civil_protection_centers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add centers"
  ON public.civil_protection_centers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their centers"
  ON public.civil_protection_centers FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their centers"
  ON public.civil_protection_centers FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE TRIGGER update_civil_protection_centers_updated_at
  BEFORE UPDATE ON public.civil_protection_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Labs (analysis laboratories)
CREATE TABLE public.labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  address text,
  wilaya_id integer REFERENCES public.wilayas(id),
  baladiya_id integer REFERENCES public.baladiyas(id),
  lat double precision,
  lng double precision,
  photo_url text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.labs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.labs TO authenticated;
GRANT ALL ON public.labs TO service_role;
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "labs public read" ON public.labs FOR SELECT USING (true);
CREATE POLICY "labs owner insert" ON public.labs FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "labs owner update" ON public.labs FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "labs owner delete" ON public.labs FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER labs_set_updated_at BEFORE UPDATE ON public.labs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Charities
CREATE TABLE public.charities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  description text,
  address text,
  wilaya_id integer REFERENCES public.wilayas(id),
  baladiya_id integer REFERENCES public.baladiyas(id),
  lat double precision,
  lng double precision,
  photo_url text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.charities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.charities TO authenticated;
GRANT ALL ON public.charities TO service_role;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charities public read" ON public.charities FOR SELECT USING (true);
CREATE POLICY "charities owner insert" ON public.charities FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "charities owner update" ON public.charities FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "charities owner delete" ON public.charities FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER charities_set_updated_at BEFORE UPDATE ON public.charities FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Ambulances
CREATE TABLE public.ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  is_24_7 boolean NOT NULL DEFAULT false,
  coverage_area text,
  wilaya_id integer REFERENCES public.wilayas(id),
  baladiya_id integer REFERENCES public.baladiyas(id),
  lat double precision,
  lng double precision,
  photo_url text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ambulances TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambulances TO authenticated;
GRANT ALL ON public.ambulances TO service_role;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ambulances public read" ON public.ambulances FOR SELECT USING (true);
CREATE POLICY "ambulances owner insert" ON public.ambulances FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "ambulances owner update" ON public.ambulances FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "ambulances owner delete" ON public.ambulances FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER ambulances_set_updated_at BEFORE UPDATE ON public.ambulances FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

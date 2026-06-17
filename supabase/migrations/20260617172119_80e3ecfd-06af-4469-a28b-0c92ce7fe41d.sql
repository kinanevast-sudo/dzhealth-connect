
CREATE TABLE public.pharmacy_on_call (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  on_call_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pharmacy_id, on_call_date)
);

GRANT SELECT ON public.pharmacy_on_call TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pharmacy_on_call TO authenticated;
GRANT ALL ON public.pharmacy_on_call TO service_role;

ALTER TABLE public.pharmacy_on_call ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view on-call pharmacies"
  ON public.pharmacy_on_call FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add on-call entries"
  ON public.pharmacy_on_call FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update on-call entries"
  ON public.pharmacy_on_call FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete on-call entries"
  ON public.pharmacy_on_call FOR DELETE TO authenticated USING (true);

CREATE INDEX pharmacy_on_call_date_idx ON public.pharmacy_on_call (on_call_date);
CREATE INDEX pharmacy_on_call_pharmacy_idx ON public.pharmacy_on_call (pharmacy_id);


DO $$ BEGIN
  CREATE TYPE public.pharmacy_shift_type AS ENUM ('day','night','full');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.pharmacy_on_call
  ADD COLUMN IF NOT EXISTS shift_type public.pharmacy_shift_type NOT NULL DEFAULT 'full';

ALTER TABLE public.pharmacy_on_call
  DROP CONSTRAINT IF EXISTS pharmacy_on_call_pharmacy_id_on_call_date_key;

ALTER TABLE public.pharmacy_on_call
  DROP CONSTRAINT IF EXISTS pharmacy_on_call_pharmacy_date_shift_key;

ALTER TABLE public.pharmacy_on_call
  ADD CONSTRAINT pharmacy_on_call_pharmacy_date_shift_key UNIQUE (pharmacy_id, on_call_date, shift_type);

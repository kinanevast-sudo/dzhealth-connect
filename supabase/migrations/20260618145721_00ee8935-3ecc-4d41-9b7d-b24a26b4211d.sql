-- Admin full-access policies on existing resource tables.
-- Existing user policies remain untouched; we ADD admin policies only.

DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'doctors','hospitals','pharmacies','pharmacy_on_call','blood_donors',
    'blood_requests','equipment','ambulances','civil_protection_centers',
    'charities','labs','profiles','notifications','appointments','specialties',
    'doctor_reviews','reviews'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "admins_full_access" ON public.%I', t);
    EXECUTE format($p$
      CREATE POLICY "admins_full_access" ON public.%I
      FOR ALL TO authenticated
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()))
    $p$, t);
  END LOOP;
END $$;

-- Admin read-only on lookup tables already public-read (wilayas/baladiyas) — nothing to add.

-- Ensure admins can read all profiles (some installs scope to self)
DROP POLICY IF EXISTS "admins_read_profiles" ON public.profiles;
CREATE POLICY "admins_read_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

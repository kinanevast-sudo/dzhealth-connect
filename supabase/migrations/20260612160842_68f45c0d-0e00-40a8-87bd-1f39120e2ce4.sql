
-- 1. Profiles: restrict base table to self; expose public-safe view
DROP POLICY IF EXISTS "profiles readable" ON public.profiles;
CREATE POLICY "profiles self select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT user_id, full_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 2. Reviews / doctor_reviews: restrict SELECT to authenticated (hides user_id from anon)
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews auth read" ON public.reviews
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "reviews readable" ON public.doctor_reviews;
CREATE POLICY "doctor_reviews auth read" ON public.doctor_reviews
  FOR SELECT TO authenticated USING (true);

-- 3. Blood donors: restrict reads to authenticated (phone/address PII)
DROP POLICY IF EXISTS "donors readable" ON public.blood_donors;
CREATE POLICY "donors auth read" ON public.blood_donors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "donors creator delete" ON public.blood_donors
  FOR DELETE TO authenticated
  USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'));

-- 4. Equipment: restrict reads to authenticated (phone PII) + delete policy
DROP POLICY IF EXISTS "equip readable" ON public.equipment;
CREATE POLICY "equip auth read" ON public.equipment
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "equip creator delete" ON public.equipment
  FOR DELETE TO authenticated
  USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'));

-- 5. Hospitals & Pharmacies: add DELETE policies (reads stay public)
CREATE POLICY "hospitals creator delete" ON public.hospitals
  FOR DELETE TO authenticated
  USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "pharm creator delete" ON public.pharmacies
  FOR DELETE TO authenticated
  USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'));

-- 6. Avatars bucket: restrict SELECT to authenticated
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_auth_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

-- 7. Lock down SECURITY DEFINER trigger function from being called directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

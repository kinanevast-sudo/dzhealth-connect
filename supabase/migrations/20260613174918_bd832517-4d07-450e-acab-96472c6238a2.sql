
DROP POLICY IF EXISTS "avatars_auth_read" ON storage.objects;
CREATE POLICY "avatars_auth_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text);

DROP POLICY IF EXISTS "pharm readable" ON public.pharmacies;
CREATE POLICY "pharm readable" ON public.pharmacies
  FOR SELECT TO authenticated
  USING (true);

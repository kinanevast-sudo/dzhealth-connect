
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS photo_url text;

-- Allow authenticated users to upload to their own folder in places bucket
CREATE POLICY "places authenticated upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'places' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "places authenticated update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'places' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "places authenticated delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'places' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone (anon + authenticated) to read images from places bucket
CREATE POLICY "places public read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'places');

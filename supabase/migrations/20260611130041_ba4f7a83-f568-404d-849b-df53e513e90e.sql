
-- Public read for avatars; authenticated users manage own folder (folder = auth.uid())
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_user_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_user_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

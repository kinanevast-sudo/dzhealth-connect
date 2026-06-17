GRANT SELECT ON public.pharmacy_on_call TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pharmacy_on_call TO authenticated;
GRANT ALL ON public.pharmacy_on_call TO service_role;
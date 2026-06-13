
REVOKE EXECUTE ON FUNCTION public.tg_blood_request_notify() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compatible_donor_types(public.blood_type) FROM PUBLIC, anon, authenticated;

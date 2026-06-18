
ALTER VIEW public.admin_submission_stats SET (security_invoker = true);

REVOKE EXECUTE ON FUNCTION public.claim_super_admin_bootstrap() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_submission(uuid, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_submission(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_super_admin_bootstrap() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_submission(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_submission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

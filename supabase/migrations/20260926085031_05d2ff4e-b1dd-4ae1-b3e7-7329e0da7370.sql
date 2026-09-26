REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.grant_first_doctor() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_first_doctor() TO supabase_auth_admin, service_role;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.booked_slots(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.booked_slots(date) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_appointment(text, text, text, date, time, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_appointment(text, text, text, date, time, integer, integer, text) TO anon, authenticated, service_role;
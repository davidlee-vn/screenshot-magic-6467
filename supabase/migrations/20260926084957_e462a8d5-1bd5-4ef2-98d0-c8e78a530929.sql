CREATE TYPE public.app_role AS ENUM ('doctor');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- First registered account becomes the doctor
CREATE OR REPLACE FUNCTION public.grant_first_doctor()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'doctor') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'doctor');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_grant_doctor
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_first_doctor();

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('BSD-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6))),
  full_name text NOT NULL,
  phone text NOT NULL,
  gest_week integer,
  gest_day integer,
  service text NOT NULL,
  appt_date date NOT NULL,
  slot_start time NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'booked',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX appointments_unique_slot
  ON public.appointments (appt_date, slot_start)
  WHERE status <> 'cancelled';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view all appointments" ON public.appointments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors can update appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'doctor')) WITH CHECK (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors can delete appointments" ON public.appointments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'doctor'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER appointments_set_updated_at BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public: which slots of a day are already taken (no personal data exposed)
CREATE OR REPLACE FUNCTION public.booked_slots(p_date date)
RETURNS TABLE (slot_start time)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.slot_start FROM public.appointments a
  WHERE a.appt_date = p_date AND a.status <> 'cancelled';
$$;
GRANT EXECUTE ON FUNCTION public.booked_slots(date) TO anon, authenticated;

-- Public: create an appointment, returns only the booking code
CREATE OR REPLACE FUNCTION public.create_appointment(
  p_full_name text,
  p_phone text,
  p_service text,
  p_date date,
  p_slot time,
  p_week integer DEFAULT NULL,
  p_day integer DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_code text;
BEGIN
  IF length(btrim(p_full_name)) = 0 OR length(p_full_name) > 100 THEN
    RAISE EXCEPTION 'INVALID_NAME';
  END IF;
  IF length(btrim(p_phone)) < 8 OR length(p_phone) > 20 THEN
    RAISE EXCEPTION 'INVALID_PHONE';
  END IF;
  IF p_date < v_today OR p_date > v_today + 60 THEN
    RAISE EXCEPTION 'INVALID_DATE';
  END IF;
  IF p_slot NOT IN (TIME '17:00', TIME '17:30', TIME '18:00', TIME '18:30', TIME '19:00', TIME '19:30', TIME '20:00') THEN
    RAISE EXCEPTION 'INVALID_SLOT';
  END IF;
  IF p_week IS NOT NULL AND (p_week < 0 OR p_week > 45) THEN
    RAISE EXCEPTION 'INVALID_WEEK';
  END IF;
  IF p_day IS NOT NULL AND (p_day < 0 OR p_day > 6) THEN
    RAISE EXCEPTION 'INVALID_DAY';
  END IF;
  IF p_notes IS NOT NULL AND length(p_notes) > 1000 THEN
    RAISE EXCEPTION 'INVALID_NOTES';
  END IF;

  INSERT INTO public.appointments (full_name, phone, service, appt_date, slot_start, gest_week, gest_day, notes)
  VALUES (btrim(p_full_name), btrim(p_phone), p_service, p_date, p_slot, p_week, p_day, nullif(btrim(p_notes), ''))
  RETURNING code INTO v_code;

  RETURN v_code;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'SLOT_TAKEN';
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_appointment(text, text, text, date, time, integer, integer, text) TO anon, authenticated;

-- Trigger function: create a notification on appointment insert/status change
CREATE OR REPLACE FUNCTION public.tg_appointment_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d_name text;
  when_txt text;
BEGIN
  SELECT name INTO d_name FROM public.doctors WHERE id = NEW.doctor_id;
  when_txt := to_char(NEW.scheduled_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI');

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, body, kind)
    VALUES (
      NEW.user_id,
      'تم حجز موعد',
      'موعدك مع د. ' || COALESCE(d_name, '—') || ' بتاريخ ' || when_txt || ' (قيد المراجعة)',
      'appointment'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, kind)
    VALUES (
      NEW.user_id,
      CASE NEW.status::text
        WHEN 'confirmed' THEN 'تم تأكيد الموعد'
        WHEN 'cancelled' THEN 'تم إلغاء الموعد'
        ELSE 'تحديث حالة الموعد'
      END,
      'الموعد مع د. ' || COALESCE(d_name, '—') || ' بتاريخ ' || when_txt,
      'appointment'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_notify_ins ON public.appointments;
CREATE TRIGGER appointments_notify_ins
AFTER INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.tg_appointment_notify();

DROP TRIGGER IF EXISTS appointments_notify_upd ON public.appointments;
CREATE TRIGGER appointments_notify_upd
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.tg_appointment_notify();

-- Enable realtime on notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

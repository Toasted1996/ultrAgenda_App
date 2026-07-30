-- supabase/migrations/0005_notify_trigger_url_fix.sql
-- ALTER DATABASE ... SET app.notify_function_url is not permitted for the
-- management API / connection role on hosted Supabase (requires database
-- owner/superuser privileges we don't have). Hardcode the function URL
-- directly in the trigger function body instead of reading it via
-- current_setting().

create or replace function handle_appointment_change() returns trigger as $$
declare
  msg text;
  ntype text;
begin
  if (tg_op = 'INSERT') then
    msg := 'Nueva cita confirmada';
    ntype := 'confirmed';
  elsif (new.status = 'cancelled' and old.status <> 'cancelled') then
    msg := 'Cita cancelada';
    ntype := 'cancelled';
  else
    return new;
  end if;

  insert into notifications (business_id, appointment_id, type, message)
  values (new.business_id, new.id, ntype, msg);

  perform net.http_post(
    url := 'https://stvdxvegdnqorhkhwefh.functions.supabase.co/notify-appointment-change',
    body := jsonb_build_object('appointment_id', new.id, 'type', ntype)
  );

  return new;
end;
$$ language plpgsql security definer;

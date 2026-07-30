-- supabase/migrations/0004_notify_trigger.sql
create extension if not exists pg_net with schema extensions;

alter table staff add column expo_push_token text;

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
    url := current_setting('app.notify_function_url'),
    body := jsonb_build_object('appointment_id', new.id, 'type', ntype)
  );

  return new;
end;
$$ language plpgsql security definer;

create trigger on_appointment_change
  after insert or update on appointments
  for each row execute function handle_appointment_change();

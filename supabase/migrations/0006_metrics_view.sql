-- supabase/migrations/0006_metrics_view.sql
create view daily_metrics as
select
  business_id,
  date(starts_at) as day,
  sum(price) filter (where status in ('confirmed', 'completed')) as revenue,
  count(*) filter (where status in ('confirmed', 'completed')) as booked_slots,
  count(*) as total_slots
from appointments
group by business_id, date(starts_at);

alter view daily_metrics set (security_invoker = true);

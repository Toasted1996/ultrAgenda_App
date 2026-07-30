-- supabase/migrations/0007_rls_fixes.sql
-- Final-review fixes: missing UPDATE policy on staff, and missing
-- `with check` clauses on existing UPDATE policies (appointments, notifications).

-- FIX #1 (Critical): staff had no UPDATE policy at all. lib/notifications.ts does
-- `supabase.from('staff').update({ expo_push_token: token }).eq('id', staffId)`,
-- which RLS silently blocks (0 rows affected, no error) without this policy —
-- push tokens were never persisted.
create policy "staff updates own staff row" on staff for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- FIX #6 (Important): the existing UPDATE policies on appointments/notifications
-- only had a `using` clause, which is checked against the row BEFORE the update.
-- Without a matching `with check`, an authenticated staff member could update a
-- row they own and change its business_id to a DIFFERENT business, effectively
-- writing into another tenant's data. Recreate both policies with `with check`
-- mirroring `using` so the row must still belong to the caller's business AFTER
-- the update too. Postgres does not support altering a policy's `with check`
-- in place, so each policy is dropped and recreated.
drop policy if exists "staff updates own appointments" on appointments;
create policy "staff updates own appointments" on appointments for update
  using (business_id = auth_business_id()) with check (business_id = auth_business_id());

drop policy if exists "staff updates own notifications" on notifications;
create policy "staff updates own notifications" on notifications for update
  using (business_id = auth_business_id()) with check (business_id = auth_business_id());

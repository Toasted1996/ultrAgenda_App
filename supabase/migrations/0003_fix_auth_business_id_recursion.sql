-- supabase/migrations/0003_fix_auth_business_id_recursion.sql
-- Fix: auth_business_id() queried `staff`, which has its own RLS policy that
-- calls auth_business_id() again, causing infinite recursion
-- ("stack depth limit exceeded" / error 54001) on every request touching any
-- RLS-protected table.
--
-- Fix: mark the function `security definer` (standard Supabase pattern for
-- RLS helper functions) so it runs with the privileges of its owner and
-- bypasses RLS on `staff` when resolving the caller's business_id, instead
-- of re-triggering the `staff` SELECT policy.

create or replace function auth_business_id() returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select business_id from staff where user_id = auth.uid() limit 1;
$$;

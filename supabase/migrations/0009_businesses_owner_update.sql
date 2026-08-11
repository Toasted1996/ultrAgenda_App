-- supabase/migrations/0009_businesses_owner_update.sql

-- Permite que el dueño (staff.role = 'owner') actualice los datos de su
-- propio negocio — necesario para que la pantalla de gestión de servicios
-- (config_json.services) pueda guardar cambios. Antes de esta migración
-- `businesses` solo tenía política de `select`.
create policy "owner updates own business" on businesses for update
  using (
    id = auth_business_id()
    and exists (
      select 1 from staff
      where staff.business_id = businesses.id
        and staff.user_id = auth.uid()
        and staff.role = 'owner'
    )
  );

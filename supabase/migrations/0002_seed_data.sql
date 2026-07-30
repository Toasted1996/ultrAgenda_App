-- supabase/migrations/0001b_seed_data.sql
-- Datos semilla de prueba (Task 2, Step 6) para verificar pantallas en tareas siguientes.
-- Nota: staff.user_id queda en NULL porque aun no existen usuarios de auth.users
-- vinculados; se puede actualizar manualmente luego de crear cuentas reales.

do $$
declare
  v_business_id uuid;
  v_owner_id uuid;
  v_barber_id uuid;
  v_client_1 uuid;
  v_client_2 uuid;
  v_client_3 uuid;
begin
  -- 1 business
  insert into businesses (name, timezone)
  values ('Barbería UltrAgenda Demo', 'America/Santiago')
  returning id into v_business_id;

  -- 2 staff: uno owner, uno barber
  insert into staff (business_id, full_name, role)
  values (v_business_id, 'Carla Fuentes', 'owner')
  returning id into v_owner_id;

  insert into staff (business_id, full_name, role)
  values (v_business_id, 'Diego Soto', 'barber')
  returning id into v_barber_id;

  -- 3 clients
  insert into clients (business_id, full_name, phone)
  values (v_business_id, 'Matías Rojas', '+56911111111')
  returning id into v_client_1;

  insert into clients (business_id, full_name, phone)
  values (v_business_id, 'Javiera Muñoz', '+56922222222')
  returning id into v_client_2;

  insert into clients (business_id, full_name, phone)
  values (v_business_id, 'Felipe Contreras', '+56933333333')
  returning id into v_client_3;

  -- 5 appointments de ejemplo (algunas hoy, una cancelada)
  insert into appointments (business_id, staff_id, client_id, service_name, price, starts_at, duration_minutes, status)
  values
    (v_business_id, v_owner_id, v_client_1, 'Corte clásico', 8000, date_trunc('day', now()) + interval '10 hours', 30, 'confirmed'),
    (v_business_id, v_barber_id, v_client_2, 'Corte + barba', 12000, date_trunc('day', now()) + interval '11 hours 30 minutes', 45, 'confirmed'),
    (v_business_id, v_barber_id, v_client_3, 'Afeitado', 6000, date_trunc('day', now()) + interval '15 hours', 20, 'cancelled'),
    (v_business_id, v_owner_id, v_client_2, 'Corte clásico', 8000, now() - interval '2 days', 30, 'completed'),
    (v_business_id, v_barber_id, v_client_1, 'Corte + barba', 12000, now() + interval '3 days', 45, 'confirmed');
end $$;

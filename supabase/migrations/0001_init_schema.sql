-- supabase/migrations/0001_init_schema.sql
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Santiago',
  created_at timestamptz not null default now()
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  role text not null default 'barber' check (role in ('owner', 'barber')),
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  full_name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  service_name text not null,
  price integer not null default 0,
  starts_at timestamptz not null,
  duration_minutes integer not null default 30,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  created_at timestamptz not null default now()
);

create table waitlist (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  desired_staff_id uuid references staff(id) on delete set null,
  desired_window_start timestamptz not null,
  desired_window_end timestamptz not null,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete cascade,
  type text not null check (type in ('confirmed', 'cancelled', 'waitlist_filled')),
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS: cada staff solo ve datos de su propio business_id
alter table businesses enable row level security;
alter table staff enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;
alter table waitlist enable row level security;
alter table notifications enable row level security;

create function auth_business_id() returns uuid as $$
  select business_id from staff where user_id = auth.uid() limit 1;
$$ language sql stable;

create policy "staff reads own business" on businesses for select using (id = auth_business_id());
create policy "staff reads own staff" on staff for select using (business_id = auth_business_id());
create policy "staff reads own clients" on clients for select using (business_id = auth_business_id());
create policy "staff reads own appointments" on appointments for select using (business_id = auth_business_id());
create policy "staff updates own appointments" on appointments for update using (business_id = auth_business_id());
create policy "staff reads own waitlist" on waitlist for select using (business_id = auth_business_id());
create policy "staff reads own notifications" on notifications for select using (business_id = auth_business_id());
create policy "staff updates own notifications" on notifications for update using (business_id = auth_business_id());

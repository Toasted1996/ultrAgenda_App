-- supabase/migrations/0008_whatsapp_agent.sql

-- businesses: soporte para el agente de WhatsApp
alter table businesses add column niche text;
alter table businesses add column config_json jsonb not null default '{}';
alter table businesses add column whatsapp_phone_number_id text;

-- clients: datos sensibles cifrados + identidad de WhatsApp
alter table clients add column rut_encrypted text;
alter table clients add column phone_encrypted text;
alter table clients add column email_encrypted text;
alter table clients add column whatsapp_phone_hash text;
alter table clients add column consent_accepted_at timestamptz;
alter table clients add column consent_version text default '1.0';
alter table clients alter column phone drop not null;

create index idx_clients_whatsapp_phone_hash on clients(whatsapp_phone_hash);

-- conversations: estado de la máquina de estados del agente, por cliente
create table conversations (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  client_id      uuid not null references clients(id) on delete cascade,
  state          text not null default 'idle',
  context_json   jsonb not null default '{}',
  updated_at     timestamptz not null default now(),
  unique(business_id, client_id)
);

-- faqs: preguntas frecuentes por negocio, consultadas por el agente
create table faqs (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  question    text not null,
  answer      text not null
);

-- reminders: recordatorios automáticos antes de una cita
create table reminders (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  appointment_id    uuid not null references appointments(id) on delete cascade,
  send_at           timestamptz not null,
  sent              boolean not null default false,
  message_template  text not null
);

-- notifications: agregar 'escalation' como tipo válido (reutilizada para
-- escalaciones a humano del agente de WhatsApp, en vez de una tabla nueva)
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('confirmed', 'cancelled', 'waitlist_filled', 'escalation'));

-- RLS en las tablas nuevas, mismo patrón que el resto del schema
alter table conversations enable row level security;
alter table faqs           enable row level security;
alter table reminders      enable row level security;

create policy "staff reads own conversations" on conversations for select using (business_id = auth_business_id());
create policy "staff reads own faqs" on faqs for select using (business_id = auth_business_id());
create policy "staff reads own reminders" on reminders for select using (business_id = auth_business_id());

# UltrAgenda

App móvil (Expo / React Native) para dueños y staff de negocios de servicios con hora (barberías, centros de estética) que gestionan su agenda, precios y notificaciones. Backend en Supabase: Postgres con RLS, Realtime y Edge Functions. Un agente de IA conectado por WhatsApp permite que los clientes finales agenden solos, conversando — la cita aparece al instante en esta app.

---

## ¿Qué hace este proyecto?

- El dueño y el staff de un negocio inician sesión y ven su agenda del día (o de la semana), en tiempo real.
- Los clientes finales agendan su propia cita conversando por WhatsApp con un agente de IA (repo separado, [`Full_mascotas_demo`](https://github.com/Toasted1996/multi-tenant-agent---date-appointment)) — la cita se inserta directo en esta base de datos y aparece al instante en la app, con notificación push.
- El dueño gestiona sus servicios y precios desde la app, sin tocar Supabase a mano.
- Métricas agregadas sobre las citas del negocio.

Todo está scoped por `business_id` vía Row Level Security — cada negocio solo ve y modifica sus propios datos.

---

## Arquitectura

```
Cliente final ──WhatsApp──► Agente de IA (repo separado) ──┐
                                                             ▼
Dueño/staff ──► Expo App ──► Supabase (Postgres + RLS) ◄────┘
                    │              │
                    │              ├── Realtime (postgres_changes) ──► refetch automático en la app
                    │              └── Trigger SQL ──► Edge Function ──► push notification
                    ▼
              Expo Router (file-based)
              ├── (auth)   — login
              └── (tabs)
                  ├── agenda    — hoy / semana, detalle de cita
                  ├── metrics   — vista agregada
                  ├── notifications
                  └── profile   — perfil + gestión de servicios/precios (solo dueño)
```

**Datos centrales** (`supabase/migrations/0001_init_schema.sql` en adelante): `businesses`, `staff`, `clients`, `appointments`, `notifications`, `conversations`, `faqs`, `reminders`, `waitlist` — cada uno con RLS scoped por `business_id` vía `auth_business_id()`.

---

## Funcionalidad por pantalla

| Pantalla | Ruta | Qué hace |
|---|---|---|
| Login | `app/(auth)/login.tsx` | Autenticación contra Supabase |
| Agenda | `app/(tabs)/agenda` | Lista de citas — selector Hoy/Semana, agrupado por día en vista semanal; detalle de cita en `[id].tsx` |
| Métricas | `app/(tabs)/metrics` | Vista agregada sobre citas (`lib/metrics.ts`, migración `0006_metrics_view.sql`) |
| Notificaciones | `app/(tabs)/notifications` | Push vía `expo-notifications`, disparadas por un trigger SQL + Edge Function cuando cambia una cita |
| Perfil | `app/(tabs)/profile` | Datos del staff logueado; el dueño (`role: 'owner'`) ve además el acceso a "Servicios y precios" |
| Servicios y precios | `app/(tabs)/profile/services.tsx` | Solo dueño — editar/agregar/quitar servicios (nombre, precio, duración), persistido en `businesses.config_json.services` |

---

## El agente de WhatsApp (repo separado)

El agente conversacional que atiende a los clientes finales vive en un repo Python aparte: [`Full_mascotas_demo`](https://github.com/Toasted1996/multi-tenant-agent---date-appointment). Usa **esta base de datos como única fuente de verdad** (vía service_role key, sin su propio esquema) — cuando confirma una cita, inserta directo en `appointments` de este proyecto, lo que dispara Realtime + la notificación push, sin que nadie del negocio tipee nada.

Alcance actual: un solo negocio (nicho `barbershop`), pruebas locales vía ngrok. El diseño completo está en `docs/superpowers/specs/`, y los planes de implementación tarea por tarea en `docs/superpowers/plans/`.

---

## Tech Stack

| Tecnología | Uso |
|---|---|
| Expo SDK 54, React Native | App móvil |
| Expo Router | Enrutamiento file-based, grupos `(auth)`/`(tabs)` |
| NativeWind (Tailwind) | Estilos |
| TypeScript | Todo el código de la app |
| Supabase (`@supabase/supabase-js`) | Postgres + RLS + Realtime + Edge Functions (Deno) |
| Jest + Testing Library | Tests (`__tests__/`) |

---

## Desarrollo

```bash
npm install
npm run start        # Expo (elegí Android/iOS/web desde el menú, o Expo Go)
npm run test          # Jest
npm run typecheck     # tsc --noEmit
npm run lint           # expo lint
```

Variables de entorno (`.env`, prefijo `EXPO_PUBLIC_` requerido por Expo):

| Variable | Descripción |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave anon (RLS aplica sobre esta, nunca la service_role) |

Migraciones de Supabase en `supabase/migrations/`, aplicadas con `npx supabase db push` (requiere `SUPABASE_ACCESS_TOKEN`) contra el proyecto vinculado.

---

## Seguridad

- **Row Level Security en todas las tablas**, scoped por `business_id` vía la función `auth_business_id()` — cada negocio ve y modifica únicamente sus propios datos.
- La pantalla de **servicios y precios** es owner-only tanto en la UI (`staff.role === 'owner'`) como a nivel de base de datos (política `update` en `businesses` que exige `role = 'owner'` en `staff`) — la UI es solo comodidad, la RLS es la barrera real.
- El **agente de WhatsApp** accede con la **service_role key** (bypasea RLS deliberadamente), como un servicio de backend confiable — nunca desde el cliente móvil.
- Datos sensibles del cliente final (RUT, teléfono, email) llegan cifrados desde el agente — nunca en texto plano, ni siquiera en `conversations.context_json`.

---

## Estructura de archivos

```
ultrAgenda_App/
├── app/
│   ├── (auth)/            # Login
│   └── (tabs)/
│       ├── agenda/         # Lista (hoy/semana) + detalle de cita
│       ├── metrics/
│       ├── notifications/
│       └── profile/        # Perfil + gestión de servicios/precios (owner)
├── lib/
│   ├── appointments.ts     # useAppointments(range, staffId?) — hook de datos + Realtime
│   ├── auth-context.tsx
│   ├── staff.ts             # useCurrentStaff()
│   ├── metrics.ts
│   ├── notifications.ts
│   └── supabase.ts          # Cliente Supabase
├── components/
├── supabase/
│   ├── migrations/          # Schema, RLS, triggers
│   └── functions/            # Edge Functions (Deno) — notify-appointment-change
├── types/
│   └── database.ts           # Tipos generados desde el schema de Supabase
├── __tests__/                # Jest — lib/, components/
└── docs/superpowers/          # Specs y planes de implementación de features
    ├── specs/
    └── plans/
```

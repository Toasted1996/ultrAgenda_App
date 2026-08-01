# Integración del Agente de WhatsApp con IA — Design Spec

## Contexto

UltrAgenda ya tiene una app móvil (Expo/React Native) para dueños/staff, con backend en Supabase (`businesses`, `staff`, `clients`, `appointments`, `notifications`, RLS, Realtime, push notifications). La visión original del producto (desde la landing page) es que los clientes finales reserven citas conversando por WhatsApp con una IA, y que esas citas aparezcan automáticamente en el panel del dueño.

El usuario ya tiene un agente conversacional funcional construido en Python (`Full_mascotas_demo`), actualmente conectado a **Telegram** (no WhatsApp) y a **su propio esquema de Supabase** (`tenants`, `clients`, `appointments`, `entities`, `calendar_integrations`), con reservas sincronizadas a Google Calendar/Cal.com. La arquitectura del agente ya separa mensajería, LLM y calendario en interfaces (`BaseMessenger`, `BaseLLM`, `BaseCalendar`), lo que hace viable adaptarlo sin reescribirlo desde cero.

**Hallazgo importante durante la exploración:** el agente actual, al llegar al estado `confirming` y recibir "sí", solo envía un mensaje de confirmación y cambia de estado — **nunca inserta la cita en ninguna base de datos ni crea un evento de calendario real**. Esta integración implementa ese paso faltante como parte natural del trabajo (ver sección "Creación real de la cita").

## Objetivo

Adaptar el agente Python existente para que:
1. Hable por **WhatsApp** (Cloud API de Meta) en vez de Telegram, sin perder la posibilidad de mantener Telegram si se desea en el futuro (la abstracción `BaseMessenger` ya lo permite).
2. Use el **Supabase de UltrAgenda como única fuente de verdad** (reemplaza su propio esquema de tenants/citas/calendario).
3. Las citas creadas por WhatsApp aparezcan **en tiempo real** en la app móvil del dueño, con push notification — reutilizando el trigger y la Edge Function ya construidos (Task 10 del plan de la app móvil).

## Alcance de este plan (explícitamente acotado)

- **Solo el nicho `barbershop`**, solo el negocio semilla que ya existe en Supabase (Carla Fuentes / Diego Soto). Otros nichos (veterinaria, peluquería canina, etc. que requieren registrar una mascota) quedan fuera — la expansión planeada del usuario es hacia barberías y centros de estética, ninguno de los cuales necesita la tabla `entities`, así que esa tabla **no se crea** en este plan (YAGNI).
- **Solo pruebas locales** con ngrok, igual que el flujo actual con Telegram. El despliegue a producción (hosting del backend Python, LLM en la nube en vez de Ollama local, verificación de negocio con Meta) queda para un plan aparte, después de validar que la integración funciona end-to-end.
- **Sin flujo de alta de negocios nuevos.** El agente apunta al negocio semilla existente vía una variable de entorno, no hay onboarding multi-tenant en este plan (aunque el schema se deja preparado para agregarlo después — ver `businesses.whatsapp_phone_number_id`).

## Arquitectura

```
WhatsApp (cliente) ──► Meta Cloud API ──► FastAPI webhook ──► AgentCore
                                                                  │
                        ┌─────────────────────────────────────────┼─────────────────────┐
                        ▼                        ▼                 ▼                     ▼
                 IntentClassifier          EntityExtractor    StateMachine      SupabaseAvailability (nuevo)
                        │                        │
                        └──────────┬─────────────┘
                                   ▼
                              OllamaLLM (local, sin cambios)
                                   │
                     Supabase (UltrAgenda) ──► trigger SQL existente (Task 10) ──► push + Realtime a la app móvil
```

**Se elimina del agente:**
- `app/calendar/google.py`, `app/calendar/cal_com.py`, `app/calendar/availability.py` (reemplazados por disponibilidad calculada contra `appointments`).
- Tablas propias `tenants`, `tenant_users`, `calendar_integrations` (reemplazadas por `businesses`/`staff` de UltrAgenda).
- Tabla `entities` (fuera de alcance, ver arriba).

**Se mantiene sin cambios:**
- `BaseLLM` / `OllamaLLM`, `IntentClassifier`, `EntityExtractor`, `FernetCipher`, rate limiting (`app/security/middleware.py`), `app/calendar/business_hours.py` (parseo de horarios, no depende de Google), la máquina de estados base (con un estado nuevo agregado).
- `BaseMessenger` como interfaz — se agrega una implementación nueva (`WhatsAppMessenger`) sin tocar la de Telegram, que puede coexistir o retirarse después.

## Cambios de schema en Supabase de UltrAgenda (nueva migración `0008_whatsapp_agent.sql`)

### `businesses` (ALTER)
- `niche TEXT` — nicho del negocio (`barbershop`, etc.), reutiliza el catálogo de `data/niche_config.py` del agente.
- `config_json JSONB NOT NULL DEFAULT '{}'` — overrides por negocio (horario, mensaje de bienvenida, dirección), mismo patrón que ya usaba `tenants.config_json`.
- `whatsapp_phone_number_id TEXT` — ID del número de WhatsApp Business (Meta) que recibe los mensajes de este negocio. Permite enrutar múltiples negocios a futuro; en este plan solo se configura uno.

### `clients` (ALTER)
- `rut_encrypted TEXT`
- `phone_encrypted TEXT`
- `email_encrypted TEXT`
- `whatsapp_phone_hash TEXT` — hash SHA-256 determinístico del número de WhatsApp del cliente, indexado. **Necesario** porque Fernet no es determinístico (dos cifrados del mismo valor dan resultados distintos), así que no se puede hacer `WHERE phone_encrypted = X` para reconocer a un cliente que ya escribió antes. El hash sirve solo para buscar/matchear, nunca se descifra ni se muestra.
- `consent_accepted_at TIMESTAMPTZ`
- `consent_version TEXT DEFAULT '1.0'`
- `phone` pasa a ser **nullable** (`ALTER COLUMN phone DROP NOT NULL`). Los datos semilla y cualquier flujo futuro de la app móvil siguen usándola tal cual; los clientes creados por WhatsApp usan las columnas cifradas + el hash, y dejan `phone` en `NULL`.

### Tablas nuevas
- `conversations` (`id`, `business_id` FK, `client_id` FK, `state TEXT NOT NULL DEFAULT 'idle'`, `context_json JSONB DEFAULT '{}'`, `updated_at TIMESTAMPTZ`, `UNIQUE(business_id, client_id)`) — persiste la máquina de estados por conversación, igual que la tabla `conversations` original del agente pero apuntando a `business_id`/`clients.id` de UltrAgenda.
- `faqs` (`id`, `business_id` FK, `question TEXT`, `answer TEXT`) — preguntas frecuentes por negocio, consultadas cuando el intent es `FAQ_QUERY`.
- `reminders` (`id`, `appointment_id` FK, `send_at TIMESTAMPTZ`, `sent BOOLEAN DEFAULT FALSE`, `message_template TEXT`) — recordatorios automáticos antes de la cita, enviados por un scheduler (APScheduler, ya usado en el agente).

### Reutilización en vez de tabla nueva
- **Escalaciones a humano:** no se crea tabla `escalations`. Se reutiliza la tabla `notifications` ya existente, agregando `'escalation'` al `check` constraint de la columna `type`. Así el dueño ve la escalación directamente en la pantalla de Notificaciones de la app móvil (Task 11), sin construir ninguna pantalla nueva.

### RLS
Todas las tablas nuevas llevan RLS activo, scoped por `business_id` vía la función `auth_business_id()` ya existente (Task 2/Task 2-fix), igual que el resto del schema. El agente Python accede con la **service_role key** (bypassa RLS deliberadamente, como la Edge Function de Task 10 — es un servicio de confianza actuando en nombre de un negocio, no un usuario autenticado).

## Flujo de conversación (cambios)

Se agrega un estado nuevo, `collecting_staff`, entre `collecting_service` y `collecting_datetime`:

1. El bot consulta `staff` del negocio (vía `business_id`) y pregunta: *"¿Con quién prefieres tu cita? Carla / Diego / cualquiera que esté disponible"*.
2. Si el cliente nombra a alguien, se matchea por nombre (similar a como hoy se matchea `service` contra la lista del nicho).
3. Si dice "cualquiera" o no se entiende, el sistema no pregunta de nuevo: asigna automáticamente al primer staff con un horario libre para la fecha/hora que el cliente pida después.

**Disponibilidad:** se reemplaza `find_available_slots` (Google) por una función nueva `find_available_slots_supabase(business_id, staff_id, date, duration_minutes)` que:
- Parsea el horario del negocio con `business_hours.py` (sin cambios).
- Consulta `appointments` filtrando por `staff_id` y el rango del día pedido (mismo patrón de query que ya usa la app móvil en `lib/appointments.ts`).
- Calcula huecos libres restando las citas existentes del horario laboral.

## Creación real de la cita (el paso que faltaba)

En el estado `confirming`, cuando el cliente responde "sí", el agente ahora sí:
1. Inserta una fila en `appointments`: `business_id`, `staff_id` (elegido en el paso anterior), `client_id`, `service_name`, `price` (desde `niche_config`/`config_json` del negocio), `starts_at`, `duration_minutes`, `status = 'confirmed'`.
2. Ese `INSERT` dispara automáticamente el trigger SQL `handle_appointment_change()` (ya existente desde Task 10) → crea una fila en `notifications` → llama la Edge Function `notify-appointment-change` → push al dueño + actualización en tiempo real de la Agenda en la app móvil, **sin tocar nada del código de la app móvil**.

## Mensajería: WhatsApp Cloud API

- **Nueva clase** `WhatsAppMessenger(BaseMessenger)` en `app/messaging/whatsapp.py`:
  - `extract_message(payload, ...)`: parsea el payload del webhook de Meta (formato `entry[].changes[].value.messages[]`, distinto al de Telegram) a un `IncomingMessage`.
  - `send_message(user_id, text)`: llama al Graph API de Meta (`POST /v{version}/{phone_number_id}/messages`) para enviar texto.
- **Nuevo validador de firma de webhook**: Meta firma cada webhook con `X-Hub-Signature-256` (HMAC-SHA256 sobre el body, usando el App Secret), distinto del esquema que usa Telegram (`X-Telegram-Bot-Api-Secret-Token`). Se agrega una función de validación específica en `app/security/middleware.py`, junto a la existente (no se reemplaza, coexisten).
- **Verificación del webhook (GET):** Meta requiere un endpoint `GET` que responda al *challenge* de verificación inicial al registrar la URL del webhook en Meta for Developers (`hub.mode`, `hub.verify_token`, `hub.challenge`). Se agrega ese endpoint en `main.py`.
- El número de prueba gratuito que Meta entrega al crear la app (modo desarrollo) es suficiente para todo este plan — no requiere verificación de negocio.

## Configuración / variables de entorno nuevas

En el `.env` del agente Python (proyecto separado, no el de la app móvil):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — apuntando al proyecto Supabase de UltrAgenda (mismo proyecto que usa la app móvil).
- `WHATSAPP_BUSINESS_ID` — UUID del negocio semilla en `businesses`, usado para rutear todos los mensajes entrantes mientras no exista onboarding multi-tenant.
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` — credenciales de la Cloud API de Meta.
- Se mantienen: `FERNET_ENCRYPTION_KEY`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `RATE_LIMIT_PER_MINUTE`.
- Se retiran (ya no aplican): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_SECRET_TOKEN` (a menos que se decida mantener Telegram en paralelo — no está en el alcance de este plan, pero el código no se borra, solo deja de usarse activamente).

## Testing

Se sigue la convención existente del repo (`tests/`, pytest + pytest-asyncio). Cobertura nueva esperada:
- `WhatsAppMessenger`: parseo de payload de Meta → `IncomingMessage` correcto; envío de mensaje llama al endpoint correcto con el formato correcto (mockeando `httpx`/requests).
- Validación de firma `X-Hub-Signature-256` (casos válido/inválido).
- `find_available_slots_supabase`: disponibilidad correcta contra citas existentes mockeadas.
- Selección de staff: "cualquiera" asigna al primero disponible; nombre específico matchea correctamente; nombre ambiguo/no encontrado vuelve a preguntar.
- Creación real de la cita: el `INSERT` a `appointments` se llama con los campos correctos al confirmar.
- Escalación: inserta en `notifications` con `type='escalation'` en vez de una tabla nueva.

## Fuera de alcance (explícito, para plans futuros)

- Despliegue a producción del backend Python (hosting, LLM en la nube).
- Verificación de negocio en Meta / número de WhatsApp propio (no el de prueba).
- Nichos con mascota (`entities`, veterinaria, peluquería canina, guardería).
- Onboarding de negocios nuevos vía el agente.
- Recordatorios automáticos enviados de verdad (la tabla y el diseño quedan listos, pero activar el scheduler en producción es parte del plan de despliegue).

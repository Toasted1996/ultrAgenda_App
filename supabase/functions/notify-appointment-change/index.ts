// supabase/functions/notify-appointment-change/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { appointment_id, type } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: appointment } = await supabase
    .from('appointments')
    .select('business_id, staff_id, staff:staff(expo_push_token, full_name)')
    .eq('id', appointment_id)
    .single();

  if (!appointment?.staff?.expo_push_token) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const title = type === 'cancelled' ? 'Cita cancelada' : 'Nueva cita confirmada';

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      to: appointment.staff.expo_push_token,
      title,
      body: `Barbero: ${appointment.staff.full_name}`,
      sound: 'default',
    }),
  });

  return new Response(JSON.stringify({ sent: true }), { status: 200 });
});

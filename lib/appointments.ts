import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Appointment = {
  id: string;
  service_name: string;
  starts_at: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  client: { full_name: string };
  staff: { full_name: string };
};

export type AppointmentsRange = 'today' | 'week';

function rangeBounds(range: AppointmentsRange): { start: Date; end: Date } {
  const now = new Date();

  if (range === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // 'week': lunes 00:00:00 a domingo 23:59:59.999, hora local del dispositivo.
  const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const start = new Date(now);
  start.setDate(now.getDate() - daysSinceMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function useAppointments(range: AppointmentsRange, staffId?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { start, end } = rangeBounds(range);

    let query = supabase
      .from('appointments')
      .select('id, service_name, starts_at, status, client:clients(full_name), staff:staff(full_name)')
      .gte('starts_at', start.toISOString())
      .lte('starts_at', end.toISOString());

    if (staffId) query = query.eq('staff_id', staffId);

    const { data, error } = await query.order('starts_at', { ascending: true });
    if (!error && data) setAppointments(data as unknown as Appointment[]);
    setLoading(false);
  }, [range, staffId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    const channel = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments]);

  return { appointments, loading, refetch: fetchAppointments };
}

export async function updateAppointmentStatus(id: string, status: Appointment['status']) {
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
  return { error: error?.message ?? null };
}

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

export function useAppointmentsToday(staffId?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let query = supabase
      .from('appointments')
      .select('id, service_name, starts_at, status, client:clients(full_name), staff:staff(full_name)')
      .gte('starts_at', startOfDay.toISOString())
      .lte('starts_at', endOfDay.toISOString());

    if (staffId) query = query.eq('staff_id', staffId);

    const { data, error } = await query.order('starts_at', { ascending: true });
    if (!error && data) setAppointments(data as unknown as Appointment[]);
    setLoading(false);
  }, [staffId]);

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

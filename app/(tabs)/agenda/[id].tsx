import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { updateAppointmentStatus, type Appointment } from '../../../lib/appointments';
import { formatTime, formatDayLabel } from '../../../lib/date';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from('appointments')
      .select('id, service_name, starts_at, status, client:clients(full_name), staff:staff(full_name)')
      .eq('id', id)
      .single()
      .then(({ data }) => setAppointment(data as unknown as Appointment));
  }, [id]);

  async function handleStatusChange(status: Appointment['status']) {
    if (!appointment) return;
    setSubmitting(true);
    await updateAppointmentStatus(appointment.id, status);
    setSubmitting(false);
    router.back();
  }

  if (!appointment) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 pt-14 px-6 bg-white">
      <Text className="text-2xl font-bold">{appointment.client.full_name}</Text>
      <Text className="text-gray-500 mt-1">{appointment.service_name}</Text>
      <Text className="text-gray-500">{formatDayLabel(appointment.starts_at)} · {formatTime(appointment.starts_at)}</Text>
      <Text className="text-gray-400 mt-1">Con {appointment.staff.full_name}</Text>

      <View className="flex-row mt-8 gap-3">
        <Pressable
          className="flex-1 bg-black rounded-lg py-3 items-center"
          disabled={submitting}
          onPress={() => handleStatusChange('confirmed')}
        >
          <Text className="text-white font-semibold">Confirmar</Text>
        </Pressable>
        <Pressable
          className="flex-1 border border-red-500 rounded-lg py-3 items-center"
          disabled={submitting}
          onPress={() => handleStatusChange('cancelled')}
        >
          <Text className="text-red-500 font-semibold">Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

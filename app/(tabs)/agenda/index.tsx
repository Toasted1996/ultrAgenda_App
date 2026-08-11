import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAppointments, type Appointment, type AppointmentsRange } from '../../../lib/appointments';
import { AppointmentCard } from '../../../components/AppointmentCard';

function dayLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' });
}

type ListRow = { type: 'header'; label: string } | { type: 'appointment'; appointment: Appointment };

function groupByDay(appointments: Appointment[]): ListRow[] {
  const rows: ListRow[] = [];
  let lastDay = '';
  for (const appointment of appointments) {
    const day = appointment.starts_at.slice(0, 10);
    if (day !== lastDay) {
      rows.push({ type: 'header', label: dayLabel(appointment.starts_at) });
      lastDay = day;
    }
    rows.push({ type: 'appointment', appointment });
  }
  return rows;
}

export default function AgendaScreen() {
  const [range, setRange] = useState<AppointmentsRange>('today');
  const { appointments, loading, refetch } = useAppointments(range);

  const rows = useMemo(
    () => (range === 'week' ? groupByDay(appointments) : appointments.map((a) => ({ type: 'appointment' as const, appointment: a }))),
    [range, appointments],
  );

  return (
    <View className="flex-1 pt-14 px-4 bg-white">
      <Text className="text-2xl font-bold mb-4">Agenda</Text>
      <View className="flex-row mb-4 gap-2">
        <Pressable
          className={`flex-1 rounded-lg py-2 items-center border ${range === 'today' ? 'bg-black border-black' : 'border-gray-300'}`}
          onPress={() => setRange('today')}
        >
          <Text className={range === 'today' ? 'text-white font-semibold' : 'text-gray-700'}>Hoy</Text>
        </Pressable>
        <Pressable
          className={`flex-1 rounded-lg py-2 items-center border ${range === 'week' ? 'bg-black border-black' : 'border-gray-300'}`}
          onPress={() => setRange('week')}
        >
          <Text className={range === 'week' ? 'text-white font-semibold' : 'text-gray-700'}>Semana</Text>
        </Pressable>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(row, index) => (row.type === 'header' ? `header-${row.label}-${index}` : row.appointment.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <Text className="text-gray-500 font-semibold mt-4 mb-2 capitalize">{item.label}</Text>
          ) : (
            <Pressable onPress={() => router.push(`/(tabs)/agenda/${item.appointment.id}`)}>
              <AppointmentCard appointment={item.appointment} />
            </Pressable>
          )
        }
        ListEmptyComponent={
          !loading ? (
            <Text className="text-gray-400 text-center mt-8">
              {range === 'today' ? 'Sin citas hoy' : 'Sin citas esta semana'}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

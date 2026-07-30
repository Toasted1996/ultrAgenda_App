import { View, Text } from 'react-native';
import { formatTime } from '../lib/date';

type AppointmentCardProps = {
  appointment: {
    id: string;
    service_name: string;
    starts_at: string;
    status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    client: { full_name: string };
    staff: { full_name: string };
  };
};

const STATUS_LABEL: Record<AppointmentCardProps['appointment']['status'], string> = {
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  no_show: 'No asistió',
};

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  return (
    <View className="border border-gray-200 rounded-xl p-4 mb-3 flex-row justify-between">
      <View>
        <Text className="font-semibold">{appointment.client.full_name}</Text>
        <Text className="text-gray-500">{appointment.service_name}</Text>
        <Text className="text-gray-400 text-xs">{appointment.staff.full_name}</Text>
      </View>
      <View className="items-end">
        <Text className="font-semibold">{formatTime(appointment.starts_at)}</Text>
        <Text className="text-xs text-gray-500">{STATUS_LABEL[appointment.status]}</Text>
      </View>
    </View>
  );
}

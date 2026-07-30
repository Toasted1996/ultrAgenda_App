import { FlatList, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { useAppointmentsToday } from '../../../lib/appointments';
import { AppointmentCard } from '../../../components/AppointmentCard';

export default function AgendaScreen() {
  const { appointments, loading, refetch } = useAppointmentsToday();

  return (
    <View className="flex-1 pt-14 px-4 bg-white">
      <Text className="text-2xl font-bold mb-4">Agenda de hoy</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(tabs)/agenda/${item.id}`)}>
            <AppointmentCard appointment={item} />
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text className="text-gray-400 text-center mt-8">Sin citas hoy</Text> : null}
      />
    </View>
  );
}

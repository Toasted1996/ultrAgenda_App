import { FlatList, Pressable, Text, View } from 'react-native';
import { useNotifications } from '../../../lib/notifications';

export default function NotificationsScreen() {
  const { notifications, loading, markRead } = useNotifications();

  return (
    <View className="flex-1 pt-14 px-4 bg-white">
      <Text className="text-2xl font-bold mb-4">Notificaciones</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            className={`border-b border-gray-100 py-3 ${item.read ? 'opacity-50' : ''}`}
            onPress={() => markRead(item.id)}
          >
            <Text>{item.message}</Text>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text className="text-gray-400 text-center mt-8">Sin notificaciones</Text> : null}
      />
    </View>
  );
}

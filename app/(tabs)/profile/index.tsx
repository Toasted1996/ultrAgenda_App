import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../lib/auth-context';
import { useCurrentStaff } from '../../../lib/staff';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { staff, loading } = useCurrentStaff();

  return (
    <View className="flex-1 pt-14 px-6 bg-white">
      <Text className="text-2xl font-bold mb-4">Perfil</Text>
      {!loading && staff && (
        <>
          <Text className="text-gray-700">{staff.full_name}</Text>
          <Text className="text-gray-400 mb-6">{staff.role === 'owner' ? 'Dueño' : 'Barbero'}</Text>
        </>
      )}
      {!loading && staff?.role === 'owner' && (
        <Pressable
          className="border border-gray-300 rounded-lg py-3 items-center mb-4"
          onPress={() => router.push('/(tabs)/profile/services')}
        >
          <Text className="text-gray-700 font-semibold">Servicios y precios</Text>
        </Pressable>
      )}
      <Pressable className="border border-red-500 rounded-lg py-3 items-center" onPress={signOut}>
        <Text className="text-red-500 font-semibold">Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

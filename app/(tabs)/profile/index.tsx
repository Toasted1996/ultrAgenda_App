import { View, Text, Pressable } from 'react-native';
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
      <Pressable className="border border-red-500 rounded-lg py-3 items-center" onPress={signOut}>
        <Text className="text-red-500 font-semibold">Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

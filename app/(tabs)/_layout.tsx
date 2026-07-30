import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';

export default function TabsLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#111' }}>
      <Tabs.Screen
        name="agenda/index"
        options={{ title: 'Agenda', tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="metrics/index"
        options={{ title: 'Métricas', tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{ title: 'Notificaciones', tabBarIcon: ({ color, size }) => <Ionicons name="notifications" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }}
      />
    </Tabs>
  );
}

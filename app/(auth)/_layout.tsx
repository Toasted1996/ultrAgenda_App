import { Redirect, Slot } from 'expo-router';
import { useAuth } from '../../lib/auth-context';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Redirect href="/(tabs)/agenda" />;
  return <Slot />;
}

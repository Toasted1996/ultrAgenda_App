import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth-context';

export default function Index() {
  const { session, loading } = useAuth();
  if (loading) return null;
  return <Redirect href={session ? '/(tabs)/agenda' : '/(auth)/login'} />;
}

import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError(error);
    else router.replace('/(tabs)/agenda');
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-2xl font-bold mb-6">Ingresar a UltrAgenda</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
        placeholder="Correo"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text className="text-red-600 mb-3">{error}</Text>}
      <Pressable
        className="bg-black rounded-lg py-3 items-center"
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Ingresar</Text>}
      </Pressable>
    </View>
  );
}

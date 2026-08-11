import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert } from 'react-native';
import { useCurrentStaff } from '../../../lib/staff';
import { supabase } from '../../../lib/supabase';

type Service = { name: string; price: number; duration_minutes: number };

export default function ServicesScreen() {
  const { staff, loading: staffLoading } = useCurrentStaff();
  const [services, setServices] = useState<Service[]>([]);
  const [configJson, setConfigJson] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('');

  useEffect(() => {
    if (!staff?.business_id) return;
    setLoading(true);
    supabase
      .from('businesses')
      .select('config_json')
      .eq('id', staff.business_id)
      .single()
      .then(({ data }) => {
        const config = (data?.config_json as Record<string, unknown>) ?? {};
        setConfigJson(config);
        setServices((config.services as Service[]) ?? []);
        setLoading(false);
      });
  }, [staff?.business_id]);

  async function persist(nextServices: Service[]) {
    if (!staff?.business_id) return;
    setSaving(true);
    const nextConfig = { ...configJson, services: nextServices };
    const { error } = await supabase
      .from('businesses')
      .update({ config_json: nextConfig })
      .eq('id', staff.business_id);
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'No se pudo guardar: ' + error.message);
      return;
    }
    setConfigJson(nextConfig);
    setServices(nextServices);
  }

  function updateField(index: number, field: keyof Service, value: string) {
    const next = [...services];
    if (field === 'name') {
      next[index] = { ...next[index], name: value };
    } else {
      const parsed = Number(value);
      next[index] = { ...next[index], [field]: Number.isFinite(parsed) ? parsed : 0 };
    }
    setServices(next);
  }

  function removeService(index: number) {
    persist(services.filter((_, i) => i !== index));
  }

  function addService() {
    const price = Number(newPrice);
    const duration = Number(newDuration);
    if (!newName.trim() || !Number.isFinite(price) || price <= 0 || !Number.isFinite(duration) || duration <= 0) {
      Alert.alert('Datos inválidos', 'Nombre, precio y duración deben ser válidos y mayores a cero.');
      return;
    }
    const next = [...services, { name: newName.trim(), price, duration_minutes: duration }];
    setNewName('');
    setNewPrice('');
    setNewDuration('');
    persist(next);
  }

  if (staffLoading || loading) {
    return (
      <View className="flex-1 pt-14 px-6 bg-white">
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-14 px-6 bg-white">
      <Text className="text-2xl font-bold mb-4">Servicios y precios</Text>
      <FlatList
        data={services}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={({ item, index }) => (
          <View className="flex-row items-center mb-3 gap-2">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              value={item.name}
              onChangeText={(v) => updateField(index, 'name', v)}
              onEndEditing={() => persist(services)}
            />
            <TextInput
              className="w-20 border border-gray-300 rounded-lg px-3 py-2"
              value={String(item.price)}
              keyboardType="numeric"
              onChangeText={(v) => updateField(index, 'price', v)}
              onEndEditing={() => persist(services)}
            />
            <TextInput
              className="w-16 border border-gray-300 rounded-lg px-3 py-2"
              value={String(item.duration_minutes)}
              keyboardType="numeric"
              onChangeText={(v) => updateField(index, 'duration_minutes', v)}
              onEndEditing={() => persist(services)}
            />
            <Pressable onPress={() => removeService(index)}>
              <Text className="text-red-500 font-bold">✕</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text className="text-gray-400 mb-4">Sin servicios configurados</Text>}
      />
      <View className="border-t border-gray-200 pt-4 mt-2">
        <Text className="text-gray-700 font-semibold mb-2">Agregar servicio</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 mb-2"
          placeholder="Nombre"
          value={newName}
          onChangeText={setNewName}
        />
        <View className="flex-row gap-2 mb-2">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Precio"
            keyboardType="numeric"
            value={newPrice}
            onChangeText={setNewPrice}
          />
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Duración (min)"
            keyboardType="numeric"
            value={newDuration}
            onChangeText={setNewDuration}
          />
        </View>
        <Pressable
          className="bg-black rounded-lg py-3 items-center"
          onPress={addService}
          disabled={saving}
        >
          <Text className="text-white font-semibold">{saving ? 'Guardando...' : 'Agregar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert } from 'react-native';
import { useCurrentStaff } from '../../../lib/staff';
import { supabase } from '../../../lib/supabase';

type Service = { name: string; price: number; duration_minutes: number };
type NumericField = 'price' | 'duration_minutes';

export default function ServicesScreen() {
  const { staff, loading: staffLoading } = useCurrentStaff();
  const [services, setServices] = useState<Service[]>([]);
  const [configJson, setConfigJson] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!staff?.business_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('businesses')
      .select('config_json')
      .eq('id', staff.business_id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // No poblar el estado desde una respuesta fallida: si `configJson`
          // quedara en `{}` un guardado posterior sobrescribiría el
          // config_json real (hours, welcome_message, ...) del negocio.
          setLoadFailed(true);
          setLoading(false);
          Alert.alert('Error', 'No se pudo cargar la configuración: ' + error.message);
          return;
        }
        const config = (data?.config_json as Record<string, unknown>) ?? {};
        setLoadFailed(false);
        setConfigJson(config);
        setServices((config.services as Service[]) ?? []);
        setLoading(false);
      });
  }, [staff?.business_id, reloadKey]);

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

  function isValidNumber(value: number) {
    return Number.isFinite(value) && value > 0;
  }

  function updateField(index: number, field: 'name', value: string) {
    const next = [...services];
    next[index] = { ...next[index], [field]: value };
    setServices(next);
  }

  function draftKey(index: number, field: NumericField) {
    return `${index}:${field}`;
  }

  function setDraft(index: number, field: NumericField, value: string) {
    setDrafts((prev) => ({ ...prev, [draftKey(index, field)]: value }));
  }

  function clearDraft(index: number, field: NumericField) {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[draftKey(index, field)];
      return next;
    });
  }

  /** Commitea el borrador numérico sólo si es válido; si no, revierte al
   * último valor guardado y avisa (evita persistir precios/duraciones en 0). */
  function commitNumericField(index: number, field: NumericField) {
    const draft = drafts[draftKey(index, field)];
    if (draft === undefined) return;
    const parsed = Number(draft);
    if (!isValidNumber(parsed)) {
      clearDraft(index, field);
      Alert.alert('Valor inválido', 'El precio y la duración deben ser mayores a cero.');
      return;
    }
    clearDraft(index, field);
    if (parsed === services[index][field]) return;
    const next = [...services];
    next[index] = { ...next[index], [field]: parsed };
    persist(next);
  }

  function removeService(index: number) {
    // Los borradores están indexados por posición: al eliminar una fila los
    // índices se desplazan, así que se descartan.
    setDrafts({});
    persist(services.filter((_, i) => i !== index));
  }

  function addService() {
    const price = Number(newPrice);
    const duration = Number(newDuration);
    if (!newName.trim() || !isValidNumber(price) || !isValidNumber(duration)) {
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

  if (loadFailed) {
    // Sin la config real cargada, cualquier guardado sobrescribiría el
    // config_json del negocio: se bloquea la edición hasta poder recargar.
    return (
      <View className="flex-1 pt-14 px-6 bg-white">
        <Text className="text-2xl font-bold mb-4">Servicios y precios</Text>
        <Text className="text-gray-700 mb-4">
          No se pudo cargar la configuración del negocio. No es seguro editar los servicios sin
          ella.
        </Text>
        <Pressable
          className="bg-black rounded-lg py-3 items-center"
          onPress={() => setReloadKey((k) => k + 1)}
        >
          <Text className="text-white font-semibold">Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-14 px-6 bg-white">
      <Text className="text-2xl font-bold mb-4">Servicios y precios</Text>
      <FlatList
        data={services}
        keyExtractor={(_, index) => String(index)}
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
              value={drafts[draftKey(index, 'price')] ?? String(item.price)}
              keyboardType="numeric"
              onChangeText={(v) => setDraft(index, 'price', v)}
              onEndEditing={() => commitNumericField(index, 'price')}
            />
            <TextInput
              className="w-16 border border-gray-300 rounded-lg px-3 py-2"
              value={drafts[draftKey(index, 'duration_minutes')] ?? String(item.duration_minutes)}
              keyboardType="numeric"
              onChangeText={(v) => setDraft(index, 'duration_minutes', v)}
              onEndEditing={() => commitNumericField(index, 'duration_minutes')}
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

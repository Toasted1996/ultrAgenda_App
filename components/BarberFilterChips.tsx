import { ScrollView, Pressable, Text } from 'react-native';

type Barber = {
  id: string;
  full_name: string;
};

type BarberFilterChipsProps = {
  barbers: Barber[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
};

export function BarberFilterChips({ barbers, selectedId, onSelect }: BarberFilterChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <Pressable
        onPress={() => onSelect(undefined)}
        className={`px-4 py-2 rounded-full mr-2 border ${
          !selectedId ? 'bg-black border-black' : 'bg-white border-gray-200'
        }`}
      >
        <Text className={!selectedId ? 'text-white' : 'text-gray-700'}>Todos</Text>
      </Pressable>
      {barbers.map((barber) => (
        <Pressable
          key={barber.id}
          onPress={() => onSelect(barber.id)}
          className={`px-4 py-2 rounded-full mr-2 border ${
            selectedId === barber.id ? 'bg-black border-black' : 'bg-white border-gray-200'
          }`}
        >
          <Text className={selectedId === barber.id ? 'text-white' : 'text-gray-700'}>
            {barber.full_name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

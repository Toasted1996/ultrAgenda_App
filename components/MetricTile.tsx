import { View, Text } from 'react-native';

export function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 border border-gray-200 rounded-xl p-4 items-start">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className="text-2xl font-bold mt-1">{value}</Text>
    </View>
  );
}

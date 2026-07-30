import { View, Text } from 'react-native';
import { useCurrentStaff } from '../../../lib/staff';
import { useDailyMetrics } from '../../../lib/metrics';
import { MetricTile } from '../../../components/MetricTile';

export default function MetricsScreen() {
  const { staff } = useCurrentStaff();
  const { revenue, occupancyRate, loading } = useDailyMetrics(staff?.business_id);

  return (
    <View className="flex-1 pt-14 px-4 bg-white">
      <Text className="text-2xl font-bold mb-4">Métricas de hoy</Text>
      {!loading && (
        <View className="flex-row gap-3">
          <MetricTile label="Ingresos hoy" value={`$${revenue.toLocaleString('es-CL')}`} />
          <MetricTile label="Ocupación" value={`${Math.round(occupancyRate * 100)}%`} />
        </View>
      )}
    </View>
  );
}

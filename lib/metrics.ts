import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useDailyMetrics(businessId: string | undefined) {
  const [revenue, setRevenue] = useState(0);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from('daily_metrics')
      .select('revenue, booked_slots, total_slots')
      .eq('business_id', businessId)
      .eq('day', today)
      .single()
      .then(({ data }: { data: { revenue: number; booked_slots: number; total_slots: number } | null }) => {
        setRevenue(data?.revenue ?? 0);
        setOccupancyRate(data && data.total_slots > 0 ? data.booked_slots / data.total_slots : 0);
        setLoading(false);
      });
  }, [businessId]);

  return { revenue, occupancyRate, loading };
}

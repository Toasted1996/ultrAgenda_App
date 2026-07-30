import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { toLocalDateKey } from './date';

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
    const today = toLocalDateKey(new Date());
    supabase
      .from('daily_metrics')
      .select('revenue, booked_slots, total_slots')
      .eq('business_id', businessId)
      .eq('day', today)
      .single()
      .then(({ data }) => {
        const totalSlots = data?.total_slots ?? 0;
        const bookedSlots = data?.booked_slots ?? 0;
        setRevenue(data?.revenue ?? 0);
        setOccupancyRate(totalSlots > 0 ? bookedSlots / totalSlots : 0);
        setLoading(false);
      });
  }, [businessId]);

  return { revenue, occupancyRate, loading };
}

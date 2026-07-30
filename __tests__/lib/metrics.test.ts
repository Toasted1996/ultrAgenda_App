import { renderHook, waitFor } from '@testing-library/react-native';
import { useDailyMetrics } from '../../lib/metrics';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { revenue: 45000, booked_slots: 6, total_slots: 8 },
        error: null,
      }),
    }),
  },
}));

describe('useDailyMetrics', () => {
  it('computes occupancy rate from booked/total slots', async () => {
    const { result } = await renderHook(() => useDailyMetrics('biz-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.revenue).toBe(45000);
    expect(result.current.occupancyRate).toBe(0.75);
  });
});

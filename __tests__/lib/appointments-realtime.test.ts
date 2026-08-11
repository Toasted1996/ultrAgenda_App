import { renderHook, waitFor } from '@testing-library/react-native';
import { useAppointments } from '../../lib/appointments';
import { supabase } from '../../lib/supabase';

const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
};

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(),
  },
}));

describe('useAppointments realtime', () => {
  it('subscribes to appointments changes on mount', async () => {
    const { result } = await renderHook(() => useAppointments('today'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(supabase.channel).toHaveBeenCalledWith('appointments-changes');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: '*', table: 'appointments' }),
      expect.any(Function)
    );
  });
});

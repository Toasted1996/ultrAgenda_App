import { renderHook, waitFor } from '@testing-library/react-native';
import { useAppointments } from '../../lib/appointments';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: '1', service_name: 'Corte', starts_at: new Date().toISOString(), status: 'confirmed', client: { full_name: 'Ana' }, staff: { full_name: 'Luis' } }],
        error: null,
      }),
    }),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    }),
    removeChannel: jest.fn(),
  },
}));

describe('useAppointments', () => {
  it('loads appointments for today', async () => {
    const { result } = await renderHook(() => useAppointments('today'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.appointments[0].client.full_name).toBe('Ana');
  });
});

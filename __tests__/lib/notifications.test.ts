import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useNotifications } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ id: 'n1', message: 'Nueva cita confirmada', type: 'confirmed', read: false, created_at: new Date().toISOString() }],
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe('useNotifications', () => {
  it('loads notifications ordered by date', async () => {
    const { result } = await renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toHaveLength(1);
  });

  it('marks a notification as read', async () => {
    const { result } = await renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.markRead('n1');
    });
    expect(supabase.from).toHaveBeenCalledWith('notifications');
  });
});

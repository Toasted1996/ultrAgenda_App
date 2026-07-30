import { renderHook, waitFor } from '@testing-library/react-native';
import { useCurrentStaff } from '../../lib/staff';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/auth-context', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } } }),
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'staff-1', full_name: 'Carlos', role: 'owner', business_id: 'biz-1' },
        error: null,
      }),
    }),
  },
}));

describe('useCurrentStaff', () => {
  it('resolves the staff row for the logged-in user', async () => {
    const { result } = await renderHook(() => useCurrentStaff());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.staff?.full_name).toBe('Carlos');
  });
});

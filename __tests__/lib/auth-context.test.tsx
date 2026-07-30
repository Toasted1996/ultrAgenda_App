import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe('useAuth', () => {
  it('starts with no session and loading false after init', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
  });

  it('calls supabase signInWithPassword on signIn', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.signIn('owner@example.com', 'secret123');
    });
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'secret123',
    });
  });
});

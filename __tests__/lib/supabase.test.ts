import { supabase } from '../../lib/supabase';

describe('supabase client', () => {
  it('is configured with a valid URL and auth storage', () => {
    expect(supabase.supabaseUrl).toMatch(/^https:\/\/.+\.supabase\.co$/);
    expect(supabase.auth).toBeDefined();
  });
});

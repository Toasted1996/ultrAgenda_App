import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth-context';

export type Staff = {
  id: string;
  full_name: string;
  role: 'owner' | 'barber';
  business_id: string;
};

export function useCurrentStaff() {
  const { session } = useAuth();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('staff')
      .select('id, full_name, role, business_id')
      .eq('user_id', session.user.id)
      .single()
      .then(({ data }) => {
        // The generated Supabase types widen the `role` check-constraint column
        // to `string`; narrow it back to the app's Staff union here.
        setStaff(data as Staff | null);
        setLoading(false);
      });
  }, [session?.user.id]);

  return { staff, loading };
}

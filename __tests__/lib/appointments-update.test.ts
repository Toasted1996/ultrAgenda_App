import { updateAppointmentStatus } from '../../lib/appointments';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe('updateAppointmentStatus', () => {
  it('updates the appointment status', async () => {
    const result = await updateAppointmentStatus('abc', 'cancelled');
    expect(supabase.from).toHaveBeenCalledWith('appointments');
    expect(result.error).toBeNull();
  });
});

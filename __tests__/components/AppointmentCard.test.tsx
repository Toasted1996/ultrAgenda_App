import { render, screen } from '@testing-library/react-native';
import { AppointmentCard } from '../../components/AppointmentCard';

const appointment = {
  id: '1',
  service_name: 'Corte + barba',
  starts_at: '2026-07-30T15:30:00-04:00',
  status: 'confirmed' as const,
  client: { full_name: 'Juan Pérez' },
  staff: { full_name: 'Carlos' },
};

describe('AppointmentCard', () => {
  it('renders client name, service, and time', async () => {
    await render(<AppointmentCard appointment={appointment} />);
    expect(screen.getByText('Juan Pérez')).toBeTruthy();
    expect(screen.getByText('Corte + barba')).toBeTruthy();
    expect(screen.getByText('15:30')).toBeTruthy();
  });

  it('shows a cancelled badge when status is cancelled', async () => {
    await render(<AppointmentCard appointment={{ ...appointment, status: 'cancelled' }} />);
    expect(screen.getByText('Cancelada')).toBeTruthy();
  });
});

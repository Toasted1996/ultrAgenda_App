import { render, screen } from '@testing-library/react-native';
import { MetricTile } from '../../components/MetricTile';

describe('MetricTile', () => {
  it('renders label and value', async () => {
    await render(<MetricTile label="Ingresos hoy" value="$45.000" />);
    expect(screen.getByText('Ingresos hoy')).toBeTruthy();
    expect(screen.getByText('$45.000')).toBeTruthy();
  });
});

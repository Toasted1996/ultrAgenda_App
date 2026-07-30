import { formatTime, formatDayLabel, isSameLocalDay } from '../../lib/date';

describe('date utils', () => {
  it('formats time as HH:mm', () => {
    expect(formatTime('2026-07-30T14:05:00-04:00')).toBe('14:05');
  });

  it('formats a human day label', () => {
    expect(formatDayLabel('2026-07-30T00:00:00-04:00')).toMatch(/jul/i);
  });

  it('detects same local day', () => {
    const reference = new Date('2026-07-30T10:00:00-04:00');
    expect(isSameLocalDay('2026-07-30T23:00:00-04:00', reference)).toBe(true);
    expect(isSameLocalDay('2026-07-31T01:00:00-04:00', reference)).toBe(false);
  });
});

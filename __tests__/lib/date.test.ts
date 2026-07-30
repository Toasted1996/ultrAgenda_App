import { formatTime, formatDayLabel, isSameLocalDay } from '../../lib/date';

describe('date utils', () => {
  it('formats time as HH:mm', () => {
    // Use a known ISO date with explicit offset
    const isoString = '2026-07-30T14:05:00-04:00';
    const testDate = new Date(isoString);

    // Calculate expected time dynamically based on local timezone
    // This ensures test passes regardless of the machine's timezone
    const expectedHours = String(testDate.getHours()).padStart(2, '0');
    const expectedMinutes = String(testDate.getMinutes()).padStart(2, '0');
    const expectedTime = `${expectedHours}:${expectedMinutes}`;

    expect(formatTime(isoString)).toBe(expectedTime);
  });

  it('formats a human day label', () => {
    const isoString = '2026-07-30T00:00:00-04:00';
    const testDate = new Date(isoString);
    const formatted = formatDayLabel(isoString);

    // Verify it contains the month name in Spanish (july = "jul")
    expect(formatted).toMatch(/jul/i);

    // Verify the day number is correct in the local timezone
    const expectedDay = testDate.getDate();
    expect(formatted).toContain(String(expectedDay));
  });

  it('detects same local day', () => {
    const reference = new Date('2026-07-30T10:00:00-04:00');
    expect(isSameLocalDay('2026-07-30T23:00:00-04:00', reference)).toBe(true);
    expect(isSameLocalDay('2026-07-31T01:00:00-04:00', reference)).toBe(false);
  });
});

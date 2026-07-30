export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' });
}

// Builds a YYYY-MM-DD key from the LOCAL date components of `date`, instead of
// `toISOString().slice(0, 10)` (which is UTC). This keeps "today" consistent
// with lib/appointments.ts, which computes its day range using local
// setHours(0,0,0,0)/setHours(23,59,59,999). Using UTC here would make
// "today" mean a different calendar day than Agenda for any timezone offset
// from UTC (e.g. Chile, UTC-4), especially for evening appointments.
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameLocalDay(iso: string, reference: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

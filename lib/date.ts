export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function isSameLocalDay(iso: string, reference: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

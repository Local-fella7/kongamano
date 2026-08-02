/**
 * Formats a date string into the application-wide "dd/mm/yyyy" display format,
 * e.g. "02 Aug 2026".
 *
 * Handles date-only strings ("2026-10-01"), datetime strings
 * ("2026-10-01 09:00:00") and ISO strings ("2026-10-01T09:00:00.000Z") without
 * timezone shifts for date-only values.
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const datePart = dateStr.split(' ')[0] || dateStr;
    const parts = datePart.split('-');
    let date: Date;
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return dateStr;
      date = new Date(y, m, d);
    } else {
      date = new Date(datePart);
      if (Number.isNaN(date.getTime())) return dateStr;
    }
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

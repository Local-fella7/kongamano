/**
 * Formats a date string into the application-wide display format.
 * All timestamps are displayed in EAT (East Africa Time, Africa/Nairobi, UTC+3).
 *
 * Handles date-only strings ("2026-10-01"), datetime strings
 * ("2026-10-01 09:00:00") and ISO strings ("2026-10-01T09:00:00.000Z").
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    // For date-only strings (no time component), parse as local date to avoid timezone shift
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
    if (isDateOnly) {
      const parts = dateStr.split('-');
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (Number.isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-KE', {
        timeZone: 'Africa/Nairobi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    // For datetime strings, convert to EAT (Africa/Nairobi, UTC+3)
    let parseable = dateStr.trim().replace(' ', 'T');
    if (!/Z|[+-]\d{2}:?\d{2}$/i.test(parseable)) {
      parseable += 'Z';
    }
    const date = new Date(parseable);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleString('en-KE', {
      timeZone: 'Africa/Nairobi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

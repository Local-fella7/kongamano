/**
 * Formats a 24-hour time string (e.g. "14:30:00" or "08:15") into a 12-hour AM/PM format (e.g. "2:30 PM" or "8:15 AM").
 */
export function formatServiceTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  const clean = String(timeStr).trim();

  // If already in 12-hour AM/PM format, format nicely
  const match12 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const ampm = match12[3].toUpperCase();
    if (hours === 0) hours = 12;
    if (hours > 12) hours = hours % 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  // Parse 24-hour time "HH:mm" or "HH:mm:ss"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!match24) return clean;

  let hours = parseInt(match24[1], 10);
  const minutes = match24[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Returns a readable time range string (e.g. "8:30 AM – 12:00 PM" or "Starts at 2:00 PM").
 */
export function formatServiceTimeRange(startTime?: string | null, endTime?: string | null): string {
  const start = formatServiceTime(startTime);
  const end = formatServiceTime(endTime);
  if (start && end) return `${start} – ${end}`;
  if (start) return `Starts at ${start}`;
  if (end) return `Ends at ${end}`;
  return '';
}

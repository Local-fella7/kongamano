export function isActiveOrScheduledEvent(event: any): boolean {
  if (!event) return false;
  const endDateStr = event.date_to || event.end_date;
  if (!endDateStr) return true; // Keep active if no end date specified

  try {
    let parseable = String(endDateStr).trim().replace(' ', 'T');
    if (!/Z|[+-]\d{2}:?\d{2}$/i.test(parseable)) {
      parseable += 'Z';
    }
    const endDate = new Date(parseable);
    if (Number.isNaN(endDate.getTime())) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare against beginning of today

    return endDate.getTime() >= today.getTime();
  } catch {
    return true;
  }
}

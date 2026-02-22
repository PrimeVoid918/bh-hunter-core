/**
 * Returns a new Date object that is `days` before the given date
 * @param baseDate The reference date (default: now)
 * @param days Number of days to subtract
 */
export function subDays(baseDate: Date = new Date(), days: number): Date {
  const date = new Date(baseDate);
  date.setDate(date.getDate() - days);
  return date;
}

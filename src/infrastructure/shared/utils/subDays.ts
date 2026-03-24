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

/**
 * Returns a new Date object that is `months` before the given date
 * @param baseDate The reference date (default: now)
 * @param months Number of months to subtract
 */
export function subMonths(baseDate: Date = new Date(), months: number): Date {
  const date = new Date(baseDate);
  date.setMonth(date.getMonth() - months);
  return date;
}

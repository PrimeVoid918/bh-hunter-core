export class RefundPolicy {
  calculate(checkInDate: Date, now: Date = new Date(), createdAt?: Date) {
    const hoursBeforeCheckIn =
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let percentage = 0;

    // 🟢 Grace period (NEW)
    if (createdAt) {
      const hoursSinceBooking =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceBooking <= 1) {
        return {
          percentage: 1,
          hoursBeforeCheckIn,
          refundable: true,
          status: 'FULL',
        };
      }
    }

    if (hoursBeforeCheckIn >= 72) percentage = 1;
    else if (hoursBeforeCheckIn >= 48) percentage = 0.75;
    else if (hoursBeforeCheckIn >= 24) percentage = 0.5;
    else percentage = 0;

    return {
      percentage,
      hoursBeforeCheckIn,
      refundable: percentage > 0,
      status: this.mapStatus(percentage),
    };
  }

  mapStatus(percentage: number) {
    if (percentage === 1) return 'FULL';
    if (percentage >= 0.75) return 'PARTIAL';
    if (percentage > 0) return 'ELIGIBLE';
    return 'NOT_REFUNDABLE';
  }
}

export class RefundPolicy {
  calculate(checkInDate: Date, now: Date = new Date(), createdAt?: Date) {
    const hoursBeforeCheckIn =
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    const daysBeforeCheckIn = hoursBeforeCheckIn / 24;

    // Grace period: full refund within 1 hour after booking
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

    // No automatic refund once check-in time has started/passed
    if (hoursBeforeCheckIn <= 0) {
      return {
        percentage: 0,
        hoursBeforeCheckIn,
        refundable: false,
        status: 'NOT_REFUNDABLE',
      };
    }

    let percentage = 0;

    // Boarding-house style refund windows
    if (daysBeforeCheckIn >= 7) percentage = 1;
    else if (daysBeforeCheckIn >= 3) percentage = 0.5;
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
    if (percentage >= 0.5) return 'PARTIAL';
    if (percentage > 0) return 'ELIGIBLE';
    return 'NOT_REFUNDABLE';
  }
}

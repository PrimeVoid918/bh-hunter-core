export default `
# Booking Refund Policy

**Effective Date:** April 2026  
**Applies To:** Booking transactions on BH Hunter

---

## 1. Overview

This Booking Refund Policy explains how refunds are computed when a tenant cancels a room booking on BH Hunter.

Refunds are automatically calculated based on the scheduled check-in date, the cancellation time, and the booking creation time.

---

## 2. Refund Calculation Rule

Refund eligibility is determined using:

- The scheduled check-in date and time
- The current cancellation date and time
- The booking creation date and time, when available

The system automatically computes the refund percentage. Manual computation is not required.

---

## 3. Grace Period Refund

### 🟢 Full Refund Within 1 Hour of Booking

A full refund is granted when cancellation is made within one hour after the booking was created.

- Refund percentage: **100%**
- System value: **1.0**
- Condition: Cancellation occurs within **1 hour** from booking creation

This grace period may apply even if the check-in date is near, as long as the cancellation is within the allowed one-hour booking grace period.

---

## 4. Refund Tiers Before Check-In

### 🟢 Full Refund

A full refund is granted when cancellation is made at least 7 days before the scheduled check-in date.

- Refund percentage: **100%**
- System value: **1.0**
- Condition: Cancellation is made **7 days or more** before check-in

---

### 🟡 Partial Refund

A partial refund is granted when cancellation is made at least 3 days before the scheduled check-in date, but less than 7 days before check-in.

- Refund percentage: **50%**
- System value: **0.5**
- Condition: Cancellation is made **3 days or more** before check-in, but less than 7 days before check-in

---

### 🔴 No Refund

No refund will be issued when cancellation is made less than 3 days before the scheduled check-in date.

- Refund percentage: **0%**
- System value: **0**
- Condition: Cancellation is made **less than 3 days** before check-in

---

## 5. No Refund After Check-In

No automatic refund will be issued once the scheduled check-in time has started or passed.

This applies when:

- Check-in time has already passed
- Booking is considered active or consumed
- Cancellation is made after the booking start time

- Refund percentage: **0%**
- System status: **NOT_REFUNDABLE**

---

## 6. System-Based Calculation

Refunds are automatically computed by the platform using system rules.

These rules consider:

- Check-in schedule
- Current cancellation timestamp
- Booking creation timestamp
- Internal refund policy thresholds

---

## 7. Refund Status Labels

The system may classify refund results using the following labels:

- **FULL** — 100% refund
- **PARTIAL** — 50% refund
- **NOT_REFUNDABLE** — 0% refund

---

## 8. Exceptions

BH Hunter may override refund results in exceptional cases, including but not limited to:

- System errors
- Fraudulent activity
- Payment disputes
- Administrative review

---

## 9. Refund Processing

Approved refunds are returned to the original payment method used during booking.

Processing time depends on the payment provider.

---

## 10. Agreement

By creating or confirming a booking, users agree to this Booking Refund Policy.

---

© 2026 BH Hunter – All rights reserved.
`;

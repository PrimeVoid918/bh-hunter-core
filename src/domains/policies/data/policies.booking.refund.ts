export default `
# Booking Refund Policy

**Effective Date:** April 2026  
**Applies To:** Booking transactions on BH Hunter

---

## 1. Overview

This Booking Refund Policy explains how refunds are computed when a tenant cancels a room booking on BH Hunter.

Refunds are automatically calculated based on the time remaining before the scheduled check-in date.

---

## 2. Refund Calculation Rule

Refund eligibility is determined using the difference between:

- Current cancellation time
- Scheduled check-in date and time

The system automatically computes the refund percentage. Manual computation is not required.

---

## 3. Refund Tiers

### 🟢 Full Refund (100%)

A full refund is granted when cancellation is made well before the check-in date.

- Refund percentage: **100%**
- System value: **1.0**
- Condition: Early cancellation window (significant time before check-in)

---

### 🟡 Partial Refund (75% – 50%)

Partial refunds apply when cancellation occurs closer to the check-in date.

- **75% refund** → Early partial window  
- **50% refund** → Late partial window  

- Condition:
  - Booking has not yet started
  - Check-in date is still in the future
  - Cancellation is within reduced refund period

---

### 🔴 No Refund (0%)

No refund will be issued when:

- Check-in time has already passed
- Booking is considered active or consumed
- Cancellation is too close to check-in time

- Refund percentage: **0%**

---

## 4. System-Based Calculation

Refunds are automatically computed by the platform using system rules.

These rules consider:

- Check-in schedule
- Current timestamp
- Internal refund policy thresholds

---

## 5. Exceptions

BH Hunter may override refund results in exceptional cases, including but not limited to:

- System errors
- Fraudulent activity
- Payment disputes
- Administrative review

---

## 6. Refund Processing

Approved refunds are returned to the original payment method used during booking.

Processing time depends on the payment provider.

---

## 7. Agreement

By creating or confirming a booking, users agree to this Booking Refund Policy.

---

© 2026 BH Hunter – All rights reserved.
`;

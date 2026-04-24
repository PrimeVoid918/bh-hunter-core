export type BillingStatementType = 'INITIAL_BOOKING' | 'EXTENSION';

export type BillingStatementStatus =
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'EXPIRED';

export type BookingChargeTypeForStatement =
  | 'RESERVATION_FEE'
  | 'ADVANCE_PAYMENT'
  | 'DEPOSIT'
  | 'EXTENSION_PAYMENT';

export type BookingChargeStatusForStatement =
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'EXPIRED';

export type PaymentStatusForStatement =
  | 'PENDING'
  | 'REQUIRES_ACTION'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'EXPIRED'
  | null;

export interface BillingStatementAdjustment {
  label: string;
  amount: number;
  amountText: string;
}

export interface BookingStatusChargeForStatement {
  id: number;
  type: BookingChargeTypeForStatement | string;
  status: BookingChargeStatusForStatement | string;
  amount: unknown;
  dueDate: Date | string | null;
  paidAt: Date | string | null;
  paymentStatus: PaymentStatusForStatement | string;

  description?: string | null;
  metadata?: Record<string, any> | null;
}

export interface BookingStatusResultForStatement {
  bookingId: number;
  bookingStatus: string;
  confirmedAt: Date | string | null;
  charges: BookingStatusChargeForStatement[];
  extensionRequest: {
    id: number;
    bookingId: number;
    tenantId: number;
    ownerId: number;
    currentCheckOutDate: Date | string;
    requestedCheckOutDate: Date | string;
    status: string;
    reason?: string | null;
    ownerMessage?: string | null;
    extensionChargeId?: number | null;
    approvedAt?: Date | string | null;
    paidAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  } | null;
  totals?: {
    totalCharges: number;
    paidCharges: number;
    remainingCharges: number;
  };
}

export interface BillingStatementItem {
  chargeId: number;
  type: string;
  label: string;
  description: string;
  amount: number;
  amountText: string;
  status: string;
  paymentStatus: string | null;
  dueDate: Date | string | null;
  paidAt: Date | string | null;

  metadata?: Record<string, any> | null;

  baseAmount?: number | null;
  baseAmountText?: string | null;
  adjustments?: BillingStatementAdjustment[];
  adjustmentsTotal?: number;
  adjustmentsTotalText?: string;
}

export interface BillingStatementTotals {
  totalAmount: number;
  totalAmountText: string;
  amountPaid: number;
  amountPaidText: string;
  refundedAmount: number;
  refundedAmountText: string;
  remainingBalance: number;
  remainingBalanceText: string;
}

export interface BillingStatement {
  statementNumber: string;
  type: BillingStatementType;
  title: string;
  subtitle: string;
  status: BillingStatementStatus;
  htmlPath: string;

  extensionChargeId?: number | null;
  extensionRequestId?: number | null;
  currentCheckOutDate?: Date | string | null;
  requestedCheckOutDate?: Date | string | null;

  items: BillingStatementItem[];
  totals: BillingStatementTotals;
}

export interface BillingStatementResponse {
  bookingId: number;
  bookingStatus: string;
  generatedAt: string;

  initialBillingStatement: BillingStatement | null;
  extensionBillingStatements: BillingStatement[];

  summary: {
    totalStatements: number;
    totalAmount: number;
    totalAmountText: string;
    totalPaid: number;
    totalPaidText: string;
    totalRefunded: number;
    totalRefundedText: string;
    totalRemaining: number;
    totalRemainingText: string;
  };
}

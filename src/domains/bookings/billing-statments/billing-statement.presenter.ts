import {
  BillingStatement,
  BillingStatementItem,
  BillingStatementResponse,
  BillingStatementStatus,
  BookingStatusChargeForStatement,
  BookingStatusResultForStatement,
} from './billing-statement.type';

const INITIAL_BOOKING_TYPES = new Set([
  'RESERVATION_FEE',
  'ADVANCE_PAYMENT',
  'DEPOSIT',
]);

const EXTENSION_TYPES = new Set(['EXTENSION_PAYMENT']);

export function buildBillingStatementResponse(
  bookingStatus: BookingStatusResultForStatement,
): BillingStatementResponse {
  const initialCharges = bookingStatus.charges.filter((charge) =>
    INITIAL_BOOKING_TYPES.has(charge.type),
  );

  const extensionCharges = bookingStatus.charges.filter((charge) =>
    EXTENSION_TYPES.has(charge.type),
  );

  const initialBillingStatement =
    initialCharges.length > 0
      ? buildStatement({
          bookingId: bookingStatus.bookingId,
          type: 'INITIAL_BOOKING',
          title: 'Initial Booking Billing Statement',
          subtitle:
            'Reservation fee, advance payment, and security deposit required for the approved booking.',
          statementNumber: `BS-${bookingStatus.bookingId}-INITIAL`,
          htmlPath: `/api/bookings/${bookingStatus.bookingId}/billing-statements/html?type=INITIAL_BOOKING`,
          charges: initialCharges,
        })
      : null;

  const extensionBillingStatements = extensionCharges.map((charge, index) => {
    const extensionRequest =
      bookingStatus.extensionRequest?.extensionChargeId === charge.id
        ? bookingStatus.extensionRequest
        : null;

    return buildStatement({
      bookingId: bookingStatus.bookingId,
      type: 'EXTENSION',
      title:
        extensionCharges.length > 1
          ? `Extension Billing Statement #${index + 1}`
          : 'Extension Billing Statement',
      subtitle: 'Extension payment generated after owner approval.',
      statementNumber: `BS-${bookingStatus.bookingId}-EXT-${charge.id}`,
      htmlPath: `/api/bookings/${bookingStatus.bookingId}/billing-statements/html?type=EXTENSION&chargeId=${charge.id}`,
      charges: [charge],
      extensionChargeId: charge.id,
      extensionRequestId: extensionRequest?.id ?? null,
      currentCheckOutDate: extensionRequest?.currentCheckOutDate ?? null,
      requestedCheckOutDate: extensionRequest?.requestedCheckOutDate ?? null,
    });
  });

  const allStatements = [
    ...(initialBillingStatement ? [initialBillingStatement] : []),
    ...extensionBillingStatements,
  ];

  const totalAmount = sum(
    allStatements.map((statement) => statement.totals.totalAmount),
  );

  const totalPaid = sum(
    allStatements.map((statement) => statement.totals.amountPaid),
  );

  const totalRefunded = sum(
    allStatements.map((statement) => statement.totals.refundedAmount),
  );

  const totalRemaining = sum(
    allStatements.map((statement) => statement.totals.remainingBalance),
  );

  return {
    bookingId: bookingStatus.bookingId,
    bookingStatus: bookingStatus.bookingStatus,
    generatedAt: new Date().toISOString(),

    initialBillingStatement,
    extensionBillingStatements,

    summary: {
      totalStatements: allStatements.length,
      totalAmount,
      totalAmountText: formatPeso(totalAmount),
      totalPaid,
      totalPaidText: formatPeso(totalPaid),
      totalRefunded,
      totalRefundedText: formatPeso(totalRefunded),
      totalRemaining,
      totalRemainingText: formatPeso(totalRemaining),
    },
  };
}

function buildStatement(params: {
  bookingId: number;
  type: 'INITIAL_BOOKING' | 'EXTENSION';
  title: string;
  subtitle: string;
  statementNumber: string;
  htmlPath: string;
  charges: BookingStatusChargeForStatement[];
  extensionChargeId?: number | null;
  extensionRequestId?: number | null;
  currentCheckOutDate?: Date | string | null;
  requestedCheckOutDate?: Date | string | null;
}): BillingStatement {
  const items = params.charges.map(mapChargeToItem);

  const totalAmount = sum(items.map((item) => item.amount));

  const amountPaid = sum(
    items
      .filter((item) => item.status === 'PAID' || item.paymentStatus === 'PAID')
      .map((item) => item.amount),
  );

  const refundedAmount = sum(
    items
      .filter(
        (item) =>
          item.status === 'REFUNDED' || item.paymentStatus === 'REFUNDED',
      )
      .map((item) => item.amount),
  );

  const remainingBalance = sum(
    items
      .filter((item) => item.status === 'PENDING')
      .map((item) => item.amount),
  );

  return {
    statementNumber: params.statementNumber,
    type: params.type,
    title: params.title,
    subtitle: params.subtitle,
    status: resolveStatementStatus(items),
    htmlPath: params.htmlPath,

    extensionChargeId: params.extensionChargeId ?? null,
    extensionRequestId: params.extensionRequestId ?? null,
    currentCheckOutDate: params.currentCheckOutDate ?? null,
    requestedCheckOutDate: params.requestedCheckOutDate ?? null,

    items,
    totals: {
      totalAmount,
      totalAmountText: formatPeso(totalAmount),
      amountPaid,
      amountPaidText: formatPeso(amountPaid),
      refundedAmount,
      refundedAmountText: formatPeso(refundedAmount),
      remainingBalance,
      remainingBalanceText: formatPeso(remainingBalance),
    },
  };
}

function mapChargeToItem(
  charge: BookingStatusChargeForStatement,
): BillingStatementItem {
  const amount = toNumberAmount(charge.amount);

  return {
    chargeId: charge.id,
    type: charge.type,
    label: getChargeLabel(charge.type),
    description: getChargeDescription(charge.type),
    amount,
    amountText: formatPeso(amount),
    status: String(charge.status),
    paymentStatus: charge.paymentStatus ? String(charge.paymentStatus) : null,
    dueDate: charge.dueDate,
    paidAt: charge.paidAt,
  };
}

export function renderBillingStatementHtml(
  response: BillingStatementResponse,
  options?: {
    type?: 'INITIAL_BOOKING' | 'EXTENSION';
    chargeId?: number;
  },
): string {
  const statement = pickStatementForHtml(response, options);

  if (!statement) {
    return renderMessageHtml({
      title: 'Billing Statement Not Found',
      message:
        'The selected billing statement could not be found for this booking.',
    });
  }

  return renderSingleStatementHtml(response, statement);
}

function pickStatementForHtml(
  response: BillingStatementResponse,
  options?: {
    type?: 'INITIAL_BOOKING' | 'EXTENSION';
    chargeId?: number;
  },
): BillingStatement | null {
  if (options?.type === 'EXTENSION') {
    if (!options.chargeId) return null;

    return (
      response.extensionBillingStatements.find(
        (statement) => statement.extensionChargeId === options.chargeId,
      ) ?? null
    );
  }

  return response.initialBillingStatement;
}

function renderSingleStatementHtml(
  response: BillingStatementResponse,
  statement: BillingStatement,
): string {
  const rows = statement.items
    .map(
      (item) => `<tr>
        <td>
          <strong>${escapeHtml(item.label)}</strong>
          <div class="muted">${escapeHtml(item.description)}</div>
          ${item.dueDate ? `<div class="muted">Due: ${escapeHtml(formatDate(item.dueDate))}</div>` : ''}
          ${item.paidAt ? `<div class="muted">Paid: ${escapeHtml(formatDate(item.paidAt))}</div>` : ''}
        </td>
        <td>${escapeHtml(item.status)}</td>
        <td class="amount">${escapeHtml(item.amountText)}</td>
      </tr>`,
    )
    .join('');

  const extensionDates =
    statement.type === 'EXTENSION'
      ? `<div class="meta-grid">
          <div>
            <div class="meta-label">Current Checkout</div>
            <div class="meta-value">${escapeHtml(formatDate(statement.currentCheckOutDate))}</div>
          </div>
          <div>
            <div class="meta-label">Requested Checkout</div>
            <div class="meta-value">${escapeHtml(formatDate(statement.requestedCheckOutDate))}</div>
          </div>
        </div>`
      : '';

  const badgeClass = statement.status.toLowerCase().replace('_', '-');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(statement.title)}</title>
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 18px;
      font-family: Arial, sans-serif;
      background: #f6f7f9;
      color: #222;
    }

    .page {
      max-width: 760px;
      margin: 0 auto;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 14px;
    }

    .eyebrow {
      color: #777;
      font-size: 13px;
      margin: 0 0 6px;
    }

    h1 {
      font-size: 22px;
      margin: 0 0 6px;
    }

    .subtitle {
      color: #777;
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
    }

    .top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }

    .badge {
      display: inline-block;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
      background: #eaf8f0;
      color: #1f9d55;
      white-space: nowrap;
    }

    .badge.pending,
    .badge.partially-paid {
      background: #fff7e6;
      color: #b7791f;
    }

    .badge.refunded {
      background: #e8f1ff;
      color: #2563eb;
    }

    .badge.cancelled,
    .badge.expired {
      background: #feecec;
      color: #dc2626;
    }

    .meta-grid,
    .summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 14px;
    }

    .meta-grid > div,
    .summary-card {
      background: #f9fafb;
      border: 1px solid #edf0f3;
      border-radius: 12px;
      padding: 12px;
    }

    .meta-label,
    .summary-label {
      font-size: 12px;
      color: #777;
      margin-bottom: 4px;
    }

    .meta-value,
    .summary-value {
      font-weight: 700;
      font-size: 15px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    th {
      text-align: left;
      font-size: 12px;
      color: #777;
      font-weight: 600;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    td {
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: top;
      font-size: 14px;
    }

    .amount {
      text-align: right;
    }

    .muted {
      color: #777;
      font-size: 12px;
      margin-top: 3px;
    }

    .totals {
      margin-top: 12px;
      border-top: 1px solid #eee;
      padding-top: 12px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 7px 0;
      font-size: 14px;
    }

    .total-row.strong {
      font-weight: 700;
      font-size: 17px;
    }

    @media (max-width: 520px) {
      body { padding: 12px; }

      .top {
        flex-direction: column;
      }

      .meta-grid,
      .summary {
        grid-template-columns: 1fr;
      }

      table,
      thead,
      tbody,
      th,
      td,
      tr {
        display: block;
      }

      thead {
        display: none;
      }

      tr {
        border-bottom: 1px solid #f0f0f0;
        padding: 10px 0;
      }

      td {
        border-bottom: none;
        padding: 6px 0;
      }

      .amount {
        text-align: left;
        font-weight: 700;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="card">
      <div class="top">
        <div>
          <p class="eyebrow">Booking #${escapeHtml(String(response.bookingId))}</p>
          <h1>${escapeHtml(statement.title)}</h1>
          <p class="subtitle">${escapeHtml(statement.subtitle)}</p>
          <p class="subtitle">${escapeHtml(statement.statementNumber)}</p>
        </div>
        <span class="badge ${escapeHtml(badgeClass)}">${escapeHtml(statement.status)}</span>
      </div>

      ${extensionDates}

      <div class="summary">
        <div class="summary-card">
          <div class="summary-label">Total Charges</div>
          <div class="summary-value">${escapeHtml(statement.totals.totalAmountText)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Amount Paid</div>
          <div class="summary-value">${escapeHtml(statement.totals.amountPaidText)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Refunded Amount</div>
          <div class="summary-value">${escapeHtml(statement.totals.refundedAmountText)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Remaining Balance</div>
          <div class="summary-value">${escapeHtml(statement.totals.remainingBalanceText)}</div>
        </div>
      </div>
    </section>

    <section class="card">
      <h1>Charges</h1>
      <table>
        <thead>
          <tr>
            <th>Charge</th>
            <th>Status</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Total Charges</span>
          <span>${escapeHtml(statement.totals.totalAmountText)}</span>
        </div>
        <div class="total-row">
          <span>Amount Paid</span>
          <span>${escapeHtml(statement.totals.amountPaidText)}</span>
        </div>
        <div class="total-row">
          <span>Refunded Amount</span>
          <span>${escapeHtml(statement.totals.refundedAmountText)}</span>
        </div>
        <div class="total-row strong">
          <span>Remaining Balance</span>
          <span>${escapeHtml(statement.totals.remainingBalanceText)}</span>
        </div>
      </div>
    </section>
  </main>
</body>
</html>`;
}

function renderMessageHtml(params: { title: string; message: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(params.title)}</title>
  <style>
    body {
      margin: 0;
      padding: 18px;
      font-family: Arial, sans-serif;
      background: #f6f7f9;
      color: #222;
    }

    .card {
      max-width: 720px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 18px;
    }

    h1 {
      font-size: 22px;
      margin: 0 0 8px;
    }

    p {
      color: #777;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <section class="card">
    <h1>${escapeHtml(params.title)}</h1>
    <p>${escapeHtml(params.message)}</p>
  </section>
</body>
</html>`;
}

function resolveStatementStatus(
  items: BillingStatementItem[],
): BillingStatementStatus {
  if (!items.length) return 'PENDING';

  const allRefunded = items.every(
    (item) => item.status === 'REFUNDED' || item.paymentStatus === 'REFUNDED',
  );

  if (allRefunded) return 'REFUNDED';

  const allPaid = items.every(
    (item) => item.status === 'PAID' || item.paymentStatus === 'PAID',
  );

  if (allPaid) return 'PAID';

  const allCancelled = items.every(
    (item) => item.status === 'CANCELLED' || item.paymentStatus === 'CANCELLED',
  );

  if (allCancelled) return 'CANCELLED';

  const allExpired = items.every(
    (item) => item.status === 'EXPIRED' || item.paymentStatus === 'EXPIRED',
  );

  if (allExpired) return 'EXPIRED';

  const hasPaidOrRefunded = items.some(
    (item) =>
      item.status === 'PAID' ||
      item.paymentStatus === 'PAID' ||
      item.status === 'REFUNDED' ||
      item.paymentStatus === 'REFUNDED',
  );

  const hasPending = items.some((item) => item.status === 'PENDING');

  if (hasPaidOrRefunded && hasPending) return 'PARTIALLY_PAID';

  return 'PENDING';
}

function getChargeLabel(type: string): string {
  switch (type) {
    case 'RESERVATION_FEE':
      return 'Reservation Fee';
    case 'ADVANCE_PAYMENT':
      return 'Advance Payment';
    case 'DEPOSIT':
      return 'Security Deposit';
    case 'EXTENSION_PAYMENT':
      return 'Extension Payment';
    default:
      return humanizeEnum(type);
  }
}

function getChargeDescription(type: string): string {
  switch (type) {
    case 'RESERVATION_FEE':
      return 'Secures the approved booking slot';
    case 'ADVANCE_PAYMENT':
      return 'Pre-check-in stay payment';
    case 'DEPOSIT':
      return 'Security deposit before move-in';
    case 'EXTENSION_PAYMENT':
      return 'Extends the current checkout date';
    default:
      return 'Booking-related charge';
  }
}

function toNumberAmount(value: unknown): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toString' in value &&
    typeof value.toString === 'function'
  ) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatPeso(amount: number): string {
  return `PHP ${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return 'N/A';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function humanizeEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

import React, { useMemo, useState } from 'react';
import {
  Box,
  Breadcrumbs,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  ReceiptLong as ReceiptLongIcon,
  PendingActions as PendingActionsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Replay as ReplayIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import DataTable from '@/pages/shared/components/data-table/DataTable';

import { AdminTransactionMetaData } from '@/infrastructure/admin/admin.types';
import {
  // useGetTransactionQuery,
  useGetTransactionStatsQuery,
  useGetTransactionsQuery,
} from '@/infrastructure/admin/admin.redux.api';

function formatAmount(amount: number | string, currency = 'PHP') {
  const numeric = Number(amount ?? 0);
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(numeric);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function StatusChip({ status }: { status: string }) {
  const map: Record<
    string,
    {
      label: string;
      color: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info';
    }
  > = {
    PAID: { label: 'Paid', color: 'success' },
    PENDING: { label: 'Pending', color: 'warning' },
    FAILED: { label: 'Failed', color: 'error' },
    REFUNDED: { label: 'Refunded', color: 'info' },
    CANCELLED: { label: 'Cancelled', color: 'default' },
    EXPIRED: { label: 'Expired', color: 'default' },
    REQUIRES_ACTION: { label: 'Requires Action', color: 'primary' },
  };

  const item = map[status] ?? { label: status, color: 'default' as const };

  return (
    <Chip
      label={item.label}
      color={item.color}
      size="small"
      sx={{ fontWeight: 700, borderRadius: '100px' }}
    />
  );
}

function PurchaseTypeChip({ type }: { type: string }) {
  return (
    <Chip
      label={
        type === 'ROOM_BOOKING'
          ? 'Booking'
          : type === 'SUBSCRIPTION'
            ? 'Subscription'
            : type
      }
      size="small"
      variant="outlined"
      sx={{
        borderRadius: '100px',
        fontWeight: 700,
      }}
    />
  );
}
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'outlineVariant',
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: 'none',
        height: '100%',
      }}
    >
      <Stack spacing={1.5}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          {title}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.light',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
            {value}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
export default function TransactionMainScreen() {
  const navigate = useNavigate();
  const [selectedTransaction, setSelectedTransaction] =
    useState<AdminTransactionMetaData | null>(null);

  const {
    data: transactions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTransactionsQuery();

  const { data: statsResponse } = useGetTransactionStatsQuery();

  const fallbackStats = useMemo(() => {
    const total = transactions.length;
    const paid = transactions.filter((item) => item.status === 'PAID').length;
    const pending = transactions.filter(
      (item) => item.status === 'PENDING',
    ).length;
    const failed = transactions.filter(
      (item) => item.status === 'FAILED',
    ).length;
    const refunded = transactions.filter(
      (item) => item.status === 'REFUNDED',
    ).length;

    return {
      total,
      paid,
      pending,
      failed,
      refunded,
    };
  }, [transactions]);

  const totalCollected = useMemo(() => {
    return transactions
      .filter((item) => item.status === 'PAID')
      .reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  }, [transactions]);

  const stats = statsResponse ?? fallbackStats;

  const tableConfig = [
    {
      field: 'id',
      columnName: 'Txn ID',
      body: (row: AdminTransactionMetaData) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          TXN-{String(row.id).padStart(4, '0')}
        </Typography>
      ),
    },
    {
      field: 'purchaseType',
      columnName: 'Type',
      filterType: 'text',
      body: (row: AdminTransactionMetaData) => (
        <PurchaseTypeChip type={row.purchaseType} />
      ),
    },
    {
      field: 'amount',
      columnName: 'Amount',
      body: (row: AdminTransactionMetaData) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {formatAmount(row.amount, row.currency)}
        </Typography>
      ),
    },
    {
      field: 'status',
      columnName: 'Status',
      filterType: 'text',
      body: (row: AdminTransactionMetaData) => (
        <StatusChip status={row.status} />
      ),
    },
    {
      field: 'provider',
      columnName: 'Provider',
      filterType: 'text',
      body: (row: AdminTransactionMetaData) => (
        <Typography variant="body2">{row.provider}</Typography>
      ),
    },
    {
      field: 'booking.reference',
      columnName: 'Reference',
      resolveValue: (row: AdminTransactionMetaData) =>
        row.booking?.reference ??
        (row.subscription ? `SUB-${row.subscription.id}` : '—'),
      body: (row: AdminTransactionMetaData) => (
        <Typography variant="body2">
          {row.booking?.reference ??
            (row.subscription ? `SUB-${row.subscription.id}` : '—')}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      columnName: 'Created',
      body: (row: AdminTransactionMetaData) => (
        <Typography variant="body2">{formatDate(row.createdAt)}</Typography>
      ),
    },
    {
      field: 'actions',
      columnName: 'Actions',
      body: (row: AdminTransactionMetaData) => (
        <Chip
          icon={<VisibilityIcon />}
          label="View"
          onClick={() => setSelectedTransaction(row)}
          variant="outlined"
          clickable
          sx={{
            borderRadius: '100px',
            fontWeight: 700,
          }}
        />
      ),
    },
  ];

  return (
    <Box>
      <Stack spacing={1} mb={4}>
        <Breadcrumbs sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate('/admin')}
            sx={{ cursor: 'pointer' }}
          >
            Dashboard
          </Link>
          <Typography
            color="text.primary"
            sx={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            Transactions
          </Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={800}>
          Transactions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor booking advance payments and subscription payments recorded by
          the platform.
        </Typography>
      </Stack>

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            title="All Transactions"
            value={stats.total}
            icon={<ReceiptLongIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            title="Paid"
            value={stats.paid}
            icon={<CheckCircleIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<PendingActionsIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={<CancelIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            title="Refunded"
            value={stats.refunded}
            icon={<ReplayIcon fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            title="Collected"
            value={formatAmount(totalCollected, 'PHP')}
            icon={<ReceiptLongIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      <AsyncState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
      >
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'outlineVariant',
            borderRadius: 3,
            bgcolor: 'background.paper',
            overflow: 'hidden',
            minHeight: 520,
          }}
        >
          <DataTable<AdminTransactionMetaData>
            data={transactions}
            tableConfig={tableConfig}
            enableGlobalSearch
            emptyTableMessage="No transaction records found."
          />
        </Box>
      </AsyncState>

      <Dialog
        open={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'outlineVariant',
            boxShadow: 'none',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Transaction Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review full payment information and related references.
              </Typography>
            </Box>

            <IconButton onClick={() => setSelectedTransaction(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {selectedTransaction && (
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'outlineVariant',
                  borderRadius: 3,
                  bgcolor: 'background.default',
                }}
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Transaction ID
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      TXN-{String(selectedTransaction.id).padStart(4, '0')}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box mt={0.5}>
                      <StatusChip status={selectedTransaction.status} />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Purchase Type
                    </Typography>
                    <Box mt={0.5}>
                      <PurchaseTypeChip
                        type={selectedTransaction.purchaseType}
                      />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {formatAmount(
                        selectedTransaction.amount,
                        selectedTransaction.currency,
                      )}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Provider
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.provider}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Booking Reference
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.booking?.reference ?? '—'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Subscription
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.subscription
                        ? `SUB-${selectedTransaction.subscription.id}`
                        : '—'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Owner ID
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.ownerId ?? '—'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Payer
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.userType ?? '—'} #
                      {selectedTransaction.userId ?? '—'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Created At
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedTransaction.createdAt)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Updated At
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedTransaction.updatedAt)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'outlineVariant',
                  borderRadius: 3,
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} mb={2}>
                  Provider References
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Payment ID
                    </Typography>
                    <Typography variant="body2">
                      {selectedTransaction.providerPaymentId ?? '—'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Payment Intent ID
                    </Typography>
                    <Typography variant="body2">
                      {selectedTransaction.providerPaymentIntentId ?? '—'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Payment Link ID
                    </Typography>
                    <Typography variant="body2">
                      {selectedTransaction.providerPaymentLinkId ?? '—'}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Source ID
                    </Typography>
                    <Typography variant="body2">
                      {selectedTransaction.providerSourceId ?? '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'outlineVariant',
                  borderRadius: 3,
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} mb={2}>
                  Payouts
                </Typography>

                {!selectedTransaction.payouts?.length ? (
                  <Typography variant="body2" color="text.secondary">
                    No payout records linked to this transaction.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {selectedTransaction.payouts.map((payout) => (
                      <Box
                        key={payout.id}
                        sx={{
                          p: 1.5,
                          border: '1px solid',
                          borderColor: 'outlineVariant',
                          borderRadius: 2,
                          bgcolor: 'background.default',
                        }}
                      >
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          justifyContent="space-between"
                        >
                          <Typography variant="body2" fontWeight={700}>
                            Payout #{payout.id}
                          </Typography>
                          <Typography variant="body2">
                            {formatAmount(payout.amount, payout.currency)}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Status: {payout.status} | Paid At:{' '}
                          {formatDate(payout.paidAt)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'outlineVariant',
                  borderRadius: 3,
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} mb={1}>
                  Metadata
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'outlineVariant',
                    overflowX: 'auto',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {JSON.stringify(selectedTransaction.metadata ?? {}, null, 2)}
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

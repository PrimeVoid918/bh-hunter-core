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
  Button,
  TextField,
} from '@mui/material';
import {
  Close as CloseIcon,
  Replay as ReplayIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import DataTable from '@/pages/shared/components/data-table/DataTable';

import {
  useGetRefundRequestsQuery,
  useApproveRefundRequestMutation,
  useRejectRefundRequestMutation,
} from '@/infrastructure/admin/admin.redux.api';

import { RefundRequest } from '@/infrastructure/admin/admin.types';

/* -----------------------------
  helpers
------------------------------*/
function formatAmount(amount: number | string, currency = 'PHP') {
  const numeric = Number(amount ?? 0);
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
  }).format(numeric);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

/* -----------------------------
  status chip
------------------------------*/
function StatusChip({ status }: { status: string }) {
  const map: Record<
    string,
    {
      label: string;
      color: 'success' | 'error' | 'warning' | 'default' | 'info';
    }
  > = {
    REFUND_REQUESTED: { label: 'Requested', color: 'warning' },
    REFUNDED: { label: 'Refunded', color: 'success' },
    REJECTED: { label: 'Rejected', color: 'error' },
    PAID: { label: 'Paid', color: 'info' },
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

/* -----------------------------
  stat card
------------------------------*/
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
      }}
    >
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {title}
        </Typography>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.light',
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>

          <Typography variant="h5" fontWeight={800}>
            {value}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

/* -----------------------------
  main screen
------------------------------*/
export default function RefundRequestsMainScreen() {
  const navigate = useNavigate();

  const [selected, setSelected] = useState<RefundRequest | null>(null);
  const [notes, setNotes] = useState('');

  const {
    data: refundsData = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetRefundRequestsQuery({});
  const refunds = refundsData?.data ?? [];

  const [approveRefund, { isLoading: approving }] =
    useApproveRefundRequestMutation();

  const [rejectRefund, { isLoading: rejecting }] =
    useRejectRefundRequestMutation();

  /* ---------------- stats ---------------- */
  const stats = useMemo(() => {
    return {
      total: refunds.length,
      requested: refunds.filter((r) => r.status === 'REFUND_REQUESTED').length,
      refunded: refunds.filter((r) => r.status === 'REFUNDED').length,
      rejected: refunds.filter((r) => r.status === 'REJECTED').length,
    };
  }, [refunds]);

  /* ---------------- table ---------------- */
  const tableConfig = [
    {
      field: 'id',
      columnName: 'Txn ID',
      body: (row: RefundRequest) => (
        <Typography fontWeight={700}>
          TXN-{String(row.id).padStart(4, '0')}
        </Typography>
      ),
    },
    {
      field: 'amount',
      columnName: 'Amount',
      body: (row: RefundRequest) => (
        <Typography fontWeight={700}>
          {formatAmount(row.amount, row.currency)}
        </Typography>
      ),
    },
    {
      field: 'status',
      columnName: 'Status',
      body: (row: RefundRequest) => <StatusChip status={row.status} />,
    },
    {
      field: 'user',
      columnName: 'User',
      body: (row: RefundRequest) => (
        <Typography>
          {row.userType}#{row.userId}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      columnName: 'Requested At',
      body: (row: RefundRequest) => (
        <Typography>{formatDate(row.createdAt)}</Typography>
      ),
    },
    {
      field: 'actions',
      columnName: 'Actions',
      body: (row: RefundRequest) => (
        <Chip
          icon={<VisibilityIcon />}
          label="Review"
          clickable
          variant="outlined"
          onClick={() => {
            setSelected(row);
            setNotes('');
          }}
          sx={{
            borderRadius: '100px',
            fontWeight: 700,
          }}
        />
      ),
    },
  ];

  /* ---------------- actions ---------------- */
  const handleApprove = async () => {
    if (!selected) return;

    await approveRefund({
      id: selected.id,
      adminId: 1, // TODO: replace with auth user
      notes,
    });

    setSelected(null);
    setNotes('');
    refetch();
  };

  const handleReject = async () => {
    if (!selected) return;

    await rejectRefund({
      id: selected.id,
      adminId: 1,
      notes,
    });

    setSelected(null);
    setNotes('');
    refetch();
  };

  return (
    <Box>
      {/* ---------------- HEADER ---------------- */}
      <Stack spacing={1} mb={3}>
        <Breadcrumbs>
          <Link onClick={() => navigate('/admin')} sx={{ cursor: 'pointer' }}>
            Dashboard
          </Link>
          <Typography fontWeight={700}>Refund Requests</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={800}>
          Refund Requests
        </Typography>

        <Typography color="text.secondary">
          Review and manage refund requests from tenants and subscriptions.
        </Typography>
      </Stack>

      {/* ---------------- STATS ---------------- */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total"
            value={stats.total}
            icon={<ReplayIcon fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Requested"
            value={stats.requested}
            icon={<ReplayIcon fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Refunded"
            value={stats.refunded}
            icon={<CheckCircleIcon fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={<CancelIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      {/* ---------------- TABLE ---------------- */}
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
          }}
        >
          <DataTable
            data={refunds}
            tableConfig={tableConfig}
            enableGlobalSearch
            emptyTableMessage="No refund requests found."
          />
        </Box>
      </AsyncState>

      {/* ---------------- DIALOG ---------------- */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'outlineVariant',
            boxShadow: 'none',
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between">
            <Box>
              <Typography fontWeight={800}>Refund Review</Typography>
              <Typography variant="body2" color="text.secondary">
                Approve or reject this refund request.
              </Typography>
            </Box>

            <IconButton onClick={() => setSelected(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {selected && (
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'outlineVariant',
                  borderRadius: 2,
                }}
              >
                <Typography fontWeight={700}>
                  TXN-{String(selected.id).padStart(4, '0')}
                </Typography>

                <Typography>
                  {formatAmount(selected.amount, selected.currency)}
                </Typography>

                <StatusChip status={selected.status} />
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Admin Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <Stack direction="row" spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  disabled={approving}
                  onClick={handleApprove}
                >
                  Approve
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  disabled={rejecting}
                  onClick={handleReject}
                >
                  Reject
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

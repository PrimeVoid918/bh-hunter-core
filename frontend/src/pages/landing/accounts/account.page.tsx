import React, { useState } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Stack,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useGetOneQuery,
  useGetVerificationStatusQuery,
} from '@/infrastructure/owner/owner.redux.api';
import {
  useGetActiveQuery,
  useRefundSubscriptionMutation,
} from '@/infrastructure/subscriptions/subscriptions.redux.api';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';

import {
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
// import { BillingPolicyNotice } from './BillingPolicyNotice';
import { BillingPolicyNotice } from '@/pages/shared/components/notice-containers/BillingPolicyNotice';

// New Components
import { UserInfo } from './UserInfo';
import { VerificationChecklist } from './VerificationChecklist';
// import { SubscriptionCard } from './components/SubscriptionCard'; // Extract your right-side logic here
// import SubscriptionCar

export default function AccountPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const user = JSON.parse(localStorage.getItem('owner_user') || 'null');
  const ownerId = user?.id;

  // Data Fetching
  const { data: owner, isLoading: isOwnerLoading } = useGetOneQuery(ownerId, {
    skip: !ownerId,
  });
  const { data: verifStatus, isLoading: isVerifLoading } =
    useGetVerificationStatusQuery(ownerId, { skip: !ownerId });
  const { data: activeSub, isLoading: isSubLoading } = useGetActiveQuery(
    ownerId,
    { skip: !ownerId },
  );

  const handleLogout = () => {
    localStorage.clear();
    navigate('/pricing');
  };

  const [refundSub, { isLoading: isRefunding }] =
    useRefundSubscriptionMutation();

  const handleRefundRequest = async (id: number) => {
    try {
      await refundSub(id).unwrap();
      setToast({
        open: true,
        message: 'Subscription successfully cancelled/refunded.',
        severity: 'success',
      });
    } catch (err: any) {
      setToast({
        open: true,
        message: err?.data?.message || 'Failed to process refund',
        severity: 'error',
      });
    }
  };

  if (!user)
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Button onClick={() => navigate('/pricing')}>Please Login</Button>
      </Box>
    );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={800} mb={4}>
          Owner Portal
        </Typography>

        <Grid container spacing={4}>
          {/* LEFT SIDE: Personal & Verification Info */}
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              <AsyncState isLoading={isOwnerLoading}>
                {owner && <UserInfo owner={owner} />}
              </AsyncState>

              <AsyncState isLoading={isVerifLoading}>
                {verifStatus && <VerificationChecklist data={verifStatus} />}
              </AsyncState>

              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleLogout}
                sx={{ borderRadius: 100, fontWeight: 700 }}
              >
                Logout Session
              </Button>
            </Stack>
          </Grid>

          {/* RIGHT SIDE: Subscription Management */}
          <Grid item xs={12} md={7}>
            <AsyncState isLoading={isSubLoading}>
              {activeSub ? (
                <SubscriptionCard
                  activeSub={activeSub}
                  onRefund={handleRefundRequest}
                  isProcessing={isRefunding}
                />
              ) : (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'outlineVariant',
                  }}
                >
                  <Typography variant="h6" fontWeight={800} mb={1}>
                    {' '}
                    No Active Plan{' '}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Boost your boarding house visibility on the map.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/pricing')}
                  >
                    View Subscription Plans
                  </Button>
                </Paper>
              )}
            </AsyncState>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity} variant="filled">
          {' '}
          {toast.message}{' '}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export const SubscriptionCard = ({
  activeSub,
  onRefund,
  isProcessing,
}: {
  activeSub: any;
  onRefund: (id: number) => void;
  isProcessing: boolean;
}) => {
  const [open, setOpen] = useState(false);

  const isTrial = activeSub.type === 'TRIAL';
  const startDate = new Date(activeSub.startedAt);
  const now = new Date();

  // Refund logic only applies to non-trial plans
  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isEligibleForRefund = !isTrial && diffDays <= 15;

  return (
    <Paper
      sx={{
        p: 4,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'outlineVariant',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" fontWeight={800}>
          Current Plan
        </Typography>
        {isTrial && (
          <Chip
            label="Free Trial"
            color="info"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        )}
      </Stack>

      <Stack spacing={3}>
        <Box
          sx={{
            p: 3,
            bgcolor: 'background.default',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'outlineVariant',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="caption"
                color="text.disabled"
                fontWeight={800}
              >
                {isTrial ? 'TRIAL ENDS' : 'ACTIVE SINCE'}{' '}
                {startDate.toLocaleDateString()}
              </Typography>
              <Typography variant="h5" fontWeight={800} color="primary.main">
                {activeSub.type}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                variant="caption"
                color="text.disabled"
                fontWeight={800}
              >
                EXPIRATION
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {new Date(activeSub.expiresAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <BillingPolicyNotice />

        <Button
          variant="outlined"
          color="error"
          startIcon={<CancelIcon />}
          fullWidth
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 100, py: 1.5, fontWeight: 700 }}
        >
          {isTrial ? 'End Trial Early' : 'Cancel Subscription'}
        </Button>
      </Stack>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {isTrial ? 'End Free Trial?' : 'Cancel Subscription?'}
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, lineHeight: 1.6 }}
          >
            {isTrial
              ? 'Ending your trial will immediately remove your properties from the "Boosted" search results. This action cannot be undone.'
              : isEligibleForRefund
                ? 'You are within the 15-day refund window. A prorated refund will be processed via PayMongo, and your subscription will be cancelled.'
                : 'You are outside the 15-day refund window. Your subscription will be cancelled at the next renewal date. No refund will be issued.'}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button
            onClick={() => setOpen(false)}
            sx={{ fontWeight: 700 }}
            variant="outlined"
          >
            Keep Plan
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={isProcessing}
            onClick={() => {
              onRefund(activeSub.ownerId);
              setOpen(false);
            }}
          >
            {isProcessing
              ? 'Processing...'
              : isTrial
                ? 'End Trial'
                : 'Confirm & Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

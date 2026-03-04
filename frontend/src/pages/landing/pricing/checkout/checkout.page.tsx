import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  Fade,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import {
  useCreateCheckoutMutation,
  useGetPlansByIdQuery,
} from '@/infrastructure/subscriptions/subscriptions.redux.api';
import { useLoginMutation } from '@/infrastructure/auth/auth.redux.api';
import { useGetOneQuery } from '@/infrastructure/owner/owner.redux.api';
import { Owner } from '@/infrastructure/owner/owner.types';
import { RootState } from '@/app/store/stores';

import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import { IdentitySection } from './IdentitySection';
import { PlanSummary } from './PlanSummary';
import { LoginModal } from './LoginModal';
import {
  formatUserRole,
  formatVerificationLevel,
} from '@/infrastructure/utils/enum-formatter.util';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('id');

  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const {
    data: plan,
    isLoading: isPlanLoading,
    isError: isPlanError,
    error: planError,
  } = useGetPlansByIdQuery({ planId });

  const [login, { isLoading: isLoginLoading, error: loginError }] =
    useLoginMutation();

  const [sessionUser, setSessionUser] = useState<Owner | null>(
    JSON.parse(localStorage.getItem('owner_user') || 'null'),
  );
  const reduxUser = useSelector(
    (state: RootState) => state.ownersAuth.selectedUser as Owner | null,
  );
  const user = sessionUser || reduxUser;

  const [createCheckout, { isLoading: isCheckoutLoading }] =
    useCreateCheckoutMutation();

  const {
    data: ownerData,
    isLoading: isOwnerLoading,
    refetch: refetchOwner,
  } = useGetOneQuery(user?.id as number, { skip: !user?.id });

  const handleLoginSubmit = async (formData: any) => {
    try {
      const result = await login(formData).unwrap();

      if (result.user.role !== 'OWNER') {
        setToast({
          open: true,
          message: 'Only Owners can access billing.',
          severity: 'error',
        });
        return;
      }

      setSessionUser(result.user as Owner);

      localStorage.setItem('owner_user', JSON.stringify(result.user));
      localStorage.setItem('owner_token', result.access_token);

      setToast({
        open: true,
        message: `Welcome back! You are logged in as a ${formatUserRole(result.user.role)}.`,
        severity: 'success',
      });

      setLoginModalOpen(false);
    } catch (err) {
      // loginError handles this
    }
  };

  const handleLogout = () => {
    setSessionUser(null);
    localStorage.removeItem('owner_user');
    localStorage.removeItem('owner_token');
    setToast({ open: true, message: 'Session cleared.', severity: 'success' });
  };

  const handleProceedToPayment = async () => {
    const activeUser = ownerData || user;

    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    const isVerified =
      activeUser?.registrationStatus === 'COMPLETED' &&
      activeUser?.verificationLevel === 'FULLY_VERIFIED';

    if (activeUser?.role !== 'OWNER') {
      setToast({
        open: true,
        message: 'Only Owners can subscribe.',
        severity: 'error',
      });
      return;
    }

    if (!isVerified) {
      setToast({
        open: true,
        message: `Account status: ${formatVerificationLevel(
          activeUser?.registrationStatus,
        )}. Please complete verification.`,
        severity: 'error',
      });
      return;
    }

    if (!plan?.id) {
      setToast({
        open: true,
        message: 'Invalid subscription plan.',
        severity: 'error',
      });
      return;
    }

    try {
      const result = await createCheckout({
        ownerId: activeUser.id!,
        planId: plan.id,
      }).unwrap();

      window.location.href = result.checkoutUrl;
    } catch (err: any) {
      setToast({
        open: true,
        message: err?.data?.message || 'Failed to initiate checkout.',
        severity: 'error',
      });
    }
  };

  const getErrorMessage = (err: any) =>
    err?.data?.message || err?.message || null;
  const isVerifiedOwner = user?.verificationLevel === 'FULLY_VERIFIED';
  const canProceed = !!user && !isOwnerLoading && isVerifiedOwner;
  const isButtonDisabled = !canProceed || isPlanLoading || isCheckoutLoading;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 10 } }}>
      <AsyncState
        isLoading={isPlanLoading}
        isError={isPlanError}
        error={planError}
      >
        <Fade in={!isPlanLoading}>
          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'outlineVariant',
            }}
          >
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Confirm Subscription
            </Typography>

            {plan && <PlanSummary plan={plan} />}

            <IdentitySection
              user={user}
              ownerData={ownerData as Owner}
              isLoading={isOwnerLoading}
              onLoginClick={() => setLoginModalOpen(true)}
              onLogout={handleLogout}
              onRefresh={() => refetchOwner()}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={isButtonDisabled}
              onClick={handleProceedToPayment}
              endIcon={isOwnerLoading ? null : <ArrowForwardIcon />}
              sx={{
                py: 2,
                borderRadius: 2,
                fontWeight: 700,
                opacity: isButtonDisabled ? 0.7 : 1,
              }}
            >
              {isCheckoutLoading
                ? 'Redirecting to Payment...'
                : isOwnerLoading
                  ? 'Verifying Status...'
                  : 'Proceed to Payment'}
            </Button>

            <Typography
              variant="caption"
              sx={{
                mt: 3,
                display: 'block',
                textAlign: 'center',
                color: 'text.secondary',
                opacity: 0.8,
              }}
            >
              Secure checkout powered by PayMongo
            </Typography>
          </Paper>
        </Fade>
      </AsyncState>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      <LoginModal
        open={isLoginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={handleLoginSubmit}
        isLoading={isLoginLoading}
        error={getErrorMessage(loginError)}
      />
    </Container>
  );
}

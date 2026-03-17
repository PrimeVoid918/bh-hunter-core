import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Stack,
  Button,
  Chip,
  Alert,
  AlertTitle,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InfoIcon from '@mui/icons-material/Info';
import { sharedFeatures } from './pricing.types';
import {
  useGetPlansQuery,
  useGetActiveQuery,
} from '@/infrastructure/subscriptions/subscriptions.redux.api';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  const {
    data: plans,
    isError,
    isLoading,
    error,
    refetch,
  } = useGetPlansQuery();

  // 1. Session & Identity
  const user = JSON.parse(localStorage.getItem('owner_user') || 'null');
  const isLoggedIn = !!user;

  // 2. Subscription Status
  const { data: activeSub } = useGetActiveQuery(user?.id, {
    skip: !isLoggedIn,
  });

  const isTrial = activeSub?.type === 'TRIAL';
  const hasActivePaidSub = activeSub && activeSub.type !== 'TRIAL';

  return (
    <Box sx={{ bgcolor: 'background.default', py: 6, minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* --- TOP NAVIGATION BAR --- */}
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          {isLoggedIn ? (
            <Button
              component={Link}
              to="/accounts"
              variant="outlined"
              startIcon={<DashboardIcon />}
              sx={{
                borderRadius: 100,
                px: 3,
                borderColor: 'outlineVariant',
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'primary.light',
                  borderColor: 'primary.main',
                },
              }}
            >
              Manage Subscription
            </Button>
          ) : (
            <Button
              component={Link}
              to="/pricing/checkout"
              variant="text"
              startIcon={<AccountCircleIcon />}
              sx={{ borderRadius: 100, fontWeight: 700 }}
            >
              Owner Sign In
            </Button>
          )}
        </Stack>

        {/* --- DYNAMIC STATUS BANNER --- */}
        {isLoggedIn && activeSub && (
          <Alert
            severity={isTrial ? 'info' : 'success'}
            icon={isTrial ? <InfoIcon /> : <CheckIcon />}
            sx={{
              mb: 6,
              borderRadius: 4,
              border: '1px solid',
              borderColor: isTrial ? 'info.light' : 'success.light',
            }}
          >
            <AlertTitle sx={{ fontWeight: 800 }}>
              {isTrial
                ? 'You are currently on a Free Trial'
                : `Active Plan: ${activeSub.type}`}
            </AlertTitle>
            Your current access expires on{' '}
            <strong>
              {new Date(activeSub.expiresAt).toLocaleDateString()}
            </strong>
            .
            {isTrial
              ? ' Subscribe below to keep your properties boosted after the trial ends.'
              : ' You can extend your visibility by choosing a plan below.'}
          </Alert>
        )}

        {/* --- HEADER --- */}
        <Stack spacing={2} textAlign="center" sx={{ mb: 8 }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 800, fontFamily: 'Poppins' }}
          >
            Owner Subscription Plans
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Simple, transparent pricing to keep your boarding house visible to
            thousands of tenants.
          </Typography>
        </Stack>

        {/* --- PLANS GRID --- */}
        <AsyncState
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
        >
          <Grid container spacing={3} justifyContent="center">
            {plans?.map((plan) => (
              <Grid size={{ xs: 12, md: 4 }} key={plan.id}>
                <Paper
                  sx={{
                    p: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor:
                      activeSub?.type === plan.title
                        ? 'primary.main'
                        : 'outlineVariant',
                    borderRadius: 4,
                    position: 'relative',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  {/* Current Plan Indicator */}
                  {activeSub?.type === plan.title && (
                    <Chip
                      label="Your Current Plan"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: 24,
                        fontWeight: 700,
                      }}
                    />
                  )}

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {plan.title}
                  </Typography>

                  <Box sx={{ my: 3 }}>
                    <Stack direction="row" alignItems="baseline" spacing={0.5}>
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: 800, color: 'primary.main' }}
                      >
                        ₱{plan.pricePerMonth}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        / month
                      </Typography>
                    </Stack>

                    {plan.savingsPercent > 0 && (
                      <Chip
                        label={`Save ${plan.savingsPercent}%`}
                        size="small"
                        color="success"
                        sx={{ mt: 1, fontWeight: 700, borderRadius: 1 }}
                      />
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ mb: 4, fontWeight: 500 }}>
                    Total: ₱{plan.totalPrice.toLocaleString()} for{' '}
                    {plan.durationMonths} months
                  </Typography>

                  <Button
                    fullWidth
                    variant={
                      plan.durationMonths === 1 ? 'outlined' : 'contained'
                    }
                    size="large"
                    component={Link}
                    to={`/pricing/checkout?id=${plan.id}`}
                    sx={{ mt: 'auto', borderRadius: 100, py: 1.5 }}
                  >
                    {!isLoggedIn
                      ? 'Subscribe Now'
                      : isTrial
                        ? 'Activate Full Plan'
                        : 'Extend Plan'}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </AsyncState>

        {/* --- FEATURES FOOTER --- */}
        <Paper
          sx={{
            mt: 6,
            p: 4,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'outlineVariant',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, mb: 3, textAlign: 'center' }}
          >
            Every plan includes full platform access:
          </Typography>
          <Grid container spacing={2}>
            {sharedFeatures.map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CheckIcon color="primary" sx={{ fontSize: 20 }} />
                  <Typography variant="body2">{feature}</Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}

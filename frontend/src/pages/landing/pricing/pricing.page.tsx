import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Stack,
  Button,
  Chip,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { subscriptionPlans, sharedFeatures } from './pricing.types';
import { useGetPlansQuery } from '@/infrastructure/subscriptions/subscriptions.redux.api';
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

  return (
    <Box sx={{ bgcolor: 'background.default', py: 10 }}>
      <Container maxWidth="lg">
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

        <AsyncState
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch} // RTK Query gives you this for free
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
                    borderColor: 'outlineVariant',
                    borderRadius: 4,
                    transition: 'border-color 0.2s',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
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
                  >
                    Subscribe Now
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </AsyncState>

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

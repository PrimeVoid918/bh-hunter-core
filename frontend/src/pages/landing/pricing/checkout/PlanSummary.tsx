import { Box, Typography, Stack, Divider, Chip } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface PlanSummaryProps {
  plan: {
    title: string;
    durationMonths: number;
    pricePerMonth: number;
    totalPrice: number;
    savingsPercent: number;
  };
}

export const PlanSummary = ({ plan }: PlanSummaryProps) => {
  return (
    <Box
      sx={{
        bgcolor: 'primary.light',
        p: 3,
        borderRadius: 3,
        mb: 4,
        border: '1px solid',
        borderColor: 'primary.main',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CalendarTodayIcon
        sx={{
          position: 'absolute',
          right: -10,
          bottom: -10,
          fontSize: 80,
          opacity: 0.05,
          color: 'primary.main',
        }}
      />

      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Selected Plan
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: 'primary.dark' }}
            >
              {plan.title}
            </Typography>
          </Box>

          {plan.savingsPercent > 0 && (
            <Chip
              label={`${plan.savingsPercent}% Discount`}
              size="small"
              color="success"
              sx={{ fontWeight: 700, borderRadius: 1 }}
            />
          )}
        </Stack>

        <Divider sx={{ borderColor: 'primary.main', opacity: 0.2 }} />

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Billing Cycle
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Every {plan.durationMonths} Months
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Total Amount
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              ₱{plan.totalPrice.toLocaleString()}
            </Typography>
          </Box>
        </Stack>

        {plan.durationMonths > 1 && (
          <Typography
            variant="caption"
            sx={{
              mt: 1,
              display: 'block',
              color: 'primary.dark',
              fontWeight: 500,
              bgcolor: 'rgba(255,255,255,0.5)',
              p: 1,
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            Equivalent to ₱{plan.pricePerMonth.toLocaleString()} per month
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

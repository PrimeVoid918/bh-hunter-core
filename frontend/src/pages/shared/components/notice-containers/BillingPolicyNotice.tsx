import { Box, Stack, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const BillingPolicyNotice = () => {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'primary.light',
        bgcolor: 'primaryContainer',
        color: 'primary.dark',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <InfoOutlinedIcon sx={{ mt: 0.2 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Subscription & Refund Policy
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, lineHeight: 1.6 }}>
            Please note the following regarding subscription cancellations and
            refunds:
          </Typography>
          <Typography
            component="ol"
            variant="body2"
            sx={{ mt: 1, pl: 3, opacity: 0.85, lineHeight: 1.6 }}
          >
            <li>
              <strong>Paid subscriptions:</strong> Cancel within the first{' '}
              <strong>15 days</strong> of payment for a{' '}
              <strong>prorated refund</strong> based on remaining days.
            </li>
            <li>
              Cancellations after 15 days will stop the subscription from
              renewing, but <strong>no refund</strong> will be issued.
            </li>
            <li>
              <strong>Trial subscriptions:</strong> Can be cancelled anytime but
              are <strong>not refundable</strong>.
            </li>
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

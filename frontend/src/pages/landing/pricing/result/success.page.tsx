import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Avatar,
  CircularProgress,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useGetActiveQuery } from '@/infrastructure/subscriptions/subscriptions.redux.api';

type StatusState = 'verifying' | 'active' | 'delayed';

interface Props {
  ownerId: number;
}

export default function SuccessPage({ ownerId }: Props) {
  const [status, setStatus] = useState<StatusState>('verifying');

  const { data: subscription, isFetching } = useGetActiveQuery(ownerId, {
    pollingInterval: 2000,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!subscription) {
        setStatus('delayed');
      }
    }, 15000); // 15s timeout protection

    if (subscription?.status === 'ACTIVE') {
      setStatus('active');
    }

    return () => clearTimeout(timeout);
  }, [subscription]);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <CircularProgress sx={{ mb: 3 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Verifying Your Payment...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We are confirming your subscription activation. This usually takes
              a few seconds.
            </Typography>
          </>
        )}

        {status === 'active' && (
          <>
            <Avatar
              sx={{
                bgcolor: 'success.light',
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 3,
              }}
            >
              <CheckCircleOutlineIcon
                sx={{ fontSize: 48, color: 'success.main' }}
              />
            </Avatar>

            <Typography variant="h4" fontWeight={800} gutterBottom>
              Subscription Activated 🎉
            </Typography>

            <Typography variant="body2" sx={{ mb: 4 }}>
              Your subscription is now active. You may return to the mobile app
              to continue managing your listings.
            </Typography>

            <Box sx={{ textAlign: 'left', mb: 3 }}>
              <Typography variant="body2">
                Status: {subscription?.status}
              </Typography>
              <Typography variant="body2">
                Expires On: {subscription?.expiresAt}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={() => window.close()}
            >
              Return to Mobile App
            </Button>
          </>
        )}

        {status === 'delayed' && (
          <>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Activation Taking Longer Than Expected
            </Typography>
            <Typography variant="body2" sx={{ mb: 4 }}>
              If your payment was deducted, please wait a moment and return to
              the mobile app. Your subscription will activate automatically once
              confirmed.
            </Typography>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Retry Verification
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
}

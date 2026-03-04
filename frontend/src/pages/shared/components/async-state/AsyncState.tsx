import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  Button,
  Backdrop,
  Fade,
  Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface AsyncStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: any;
  /** If true, shows a full-screen fixed overlay. If false, stays inside its container. */
  variant?: 'overlay' | 'inline';
  /** Optional function to trigger a refetch */
  onRetry?: () => void;
  children: React.ReactNode;
}

export default function AsyncState({
  isLoading,
  isError,
  error,
  variant = 'inline',
  onRetry,
  children,
}: AsyncStateProps) {
  // 1. LOADING STATE
  if (isLoading) {
    if (variant === 'overlay') {
      return (
        <Backdrop
          open={true}
          sx={{
            color: 'primary.main',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          <CircularProgress color="inherit" size={60} thickness={4} />
        </Backdrop>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 10,
          width: '100%',
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  // 2. ERROR STATE
  if (isError) {
    const errorMessage =
      error?.data?.message || error?.message || 'An unexpected error occurred.';

    return (
      <Fade in={true}>
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            my: 2,
            borderColor: 'error.light',
            bgcolor: 'error.main' + '05', // Very light 5% opacity error color
            textAlign: 'center',
            borderRadius: 3,
          }}
        >
          <Stack spacing={2} alignItems="center">
            <ErrorOutlineIcon color="error" sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="error.dark">
                Failed to load data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {errorMessage}
              </Typography>
            </Box>
            {onRetry && (
              <Button
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                variant="outlined"
                color="error"
                sx={{ borderRadius: 100 }}
              >
                Try Again
              </Button>
            )}
          </Stack>
        </Paper>
      </Fade>
    );
  }

  // 3. SUCCESS STATE
  return <>{children}</>;
}

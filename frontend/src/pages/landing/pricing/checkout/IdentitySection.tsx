import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Avatar,
  Chip,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { BaseUser } from '@/infrastructure/user/user.types';

import {
  formatUserRole,
  formatVerificationLevel,
} from '@/infrastructure/utils/enum-formatter.util';

interface IdentitySectionProps {
  user: BaseUser | null;
  ownerData?: BaseUser;
  isLoading: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
  onRefresh: () => void;
}

export const IdentitySection = ({
  user,
  ownerData,
  isLoading,
  onLoginClick,
  onLogout,
  onRefresh,
}: IdentitySectionProps) => {
  if (!user) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: 1.2 }}
        >
          Account Verification
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            mt: 1,
            textAlign: 'center',
            borderStyle: 'dashed',
            borderRadius: 4,
            bgcolor: 'action.hover',
          }}
        >
          <AccountCircleIcon
            sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }}
          />
          <Typography variant="body1" fontWeight={600} gutterBottom>
            Owner Identity Required
          </Typography>
          <Typography
            variant="body2"
            sx={{ mb: 3, color: 'text.secondary', px: 2 }}
          >
            Please sign in to link your property owner profile and proceed with
            the subscription.
          </Typography>
          <Button
            variant="contained"
            startIcon={<LockOpenIcon />}
            onClick={onLoginClick}
            sx={{ borderRadius: 100, px: 4, boxShadow: 'none' }}
          >
            Sign In
          </Button>
        </Paper>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Skeleton
        variant="rounded"
        height={120}
        sx={{ borderRadius: 4, mb: 4, mt: 3 }}
      />
    );
  }

  const activeUser = ownerData || user;
  const isFullyVerified =
    activeUser?.registrationStatus === 'COMPLETED' &&
    activeUser?.verificationLevel === 'FULLY_VERIFIED';

  const displayName = `${activeUser?.firstname || ''} ${activeUser?.lastname || activeUser?.username || 'Owner'}`;

  return (
    <Box sx={{ mb: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography
          variant="overline"
          sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1 }}
        >
          Linked Account
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Refresh Status">
            <IconButton
              size="small"
              onClick={onRefresh}
              sx={{ color: 'primary.main' }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton
              size="small"
              onClick={onLogout}
              sx={{ color: 'error.light' }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 4,
          bgcolor: 'background.paper',
          borderWidth: 2,
          borderColor: isFullyVerified ? 'success.main' : 'warning.main',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: isFullyVerified ? 'success.soft' : 'warning.soft',
              color: isFullyVerified ? 'success.main' : 'warning.main',
              border: '2px solid',
              borderColor: 'inherit',
            }}
          >
            {isFullyVerified ? (
              <CheckCircleIcon fontSize="large" />
            ) : (
              <PendingActionsIcon fontSize="large" />
            )}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontSize: '1rem', lineHeight: 1.2, fontWeight: 800 }}
            >
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontWeight: 600 }}
            >
              {formatUserRole(activeUser?.role)} • ID: #{activeUser?.id}
            </Typography>

            <Box sx={{ mt: 1 }}>
              <Chip
                label={formatVerificationLevel(activeUser?.verificationLevel)}
                size="small"
                variant="filled"
                color={isFullyVerified ? 'success' : 'warning'}
                sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
              />
            </Box>
          </Box>
        </Stack>
      </Paper>

      {!isFullyVerified && (
        <Alert
          severity="warning"
          variant="standard"
          icon={<WarningAmberIcon />}
          sx={{
            mt: 2,
            borderRadius: 3,
            fontWeight: 500,
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Verification Pending
          </Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
            Your account is currently at the{' '}
            <strong>
              {formatVerificationLevel(activeUser?.verificationLevel)}
            </strong>{' '}
            stage. Please upload your business permits in the Owner Portal to
            unlock payments.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

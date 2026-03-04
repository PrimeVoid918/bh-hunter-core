import {
  Modal,
  Paper,
  Typography,
  Stack,
  Box,
  IconButton,
  Divider,
  Alert,
  Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import { LoginForm } from './LoginForm';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (data: any) => void;
  isLoading: boolean;
  error: any;
}

export const LoginModal = ({
  open,
  onClose,
  onLogin,
  isLoading,
  error,
}: LoginModalProps) => (
  <Modal
    open={open}
    onClose={onClose}
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
    }}
  >
    <Paper
      sx={{
        width: '100%',
        maxWidth: 400,
        p: 4,
        borderRadius: 4,
        position: 'relative',
        border: '1px solid',
        borderColor: 'outlineVariant',
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', right: 12, top: 12 }}
      >
        <CloseIcon />
      </IconButton>

      <Stack spacing={1} sx={{ mb: 3, textAlign: 'center' }}>
        <Box sx={{ color: 'primary.main', mb: 1 }}>
          <LockPersonIcon sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h5" fontWeight={800}>
          Owner Login
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Access your portal to link this subscription.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <LoginForm onSubmit={onLogin} isLoading={isLoading} />

      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" color="text.disabled">
          NEW HERE?
        </Typography>
      </Divider>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Don't have an account?{' '}
          <Link
            href="/auth/register-owner"
            underline="hover"
            sx={{ fontWeight: 700 }}
          >
            Register BH
          </Link>
        </Typography>
      </Box>
    </Paper>
  </Modal>
);

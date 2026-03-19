import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Container,
  Paper,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '@/infrastructure/auth/auth.redux.api';
import {
  loginSuccess,
  loginFailure,
} from '@/infrastructure/auth/auth.redux.slice';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function LoginScreen() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [login, { isLoading, error }] = useLoginMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      const result = await login({ username, password }).unwrap();
      dispatch(
        loginSuccess({ token: result.access_token, userData: result.user }),
      );
      navigate('/admin'); // Redirect to admin dashboard
    } catch (err: any) {
      dispatch(loginFailure(err.data?.message || 'Unauthorized Access'));
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
        fontFamily: 'Poppins',
      }}
    >
      {/* LEFT SIDE: Brand/Visual */}
      <Box
        sx={{
          flex: 1,
          bgcolor: 'primary.main',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          p: 6,
          backgroundImage:
            'linear-gradient(rgba(53, 127, 193, 0.9), rgba(18, 57, 105, 0.9)), url("https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1352&q=80")',
          backgroundSize: 'cover',
        }}
      >
        <AdminPanelSettingsIcon sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h3" fontWeight={800} textAlign="center">
          BH Hunter
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>
          Internal Administration Portal
        </Typography>
      </Box>

      {/* RIGHT SIDE: Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 3, md: 8 },
        }}
      >
        <Container maxWidth="xs">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ mb: 4, color: 'text.secondary', fontWeight: 700 }}
          >
            Back to Website
          </Button>

          <Stack spacing={1} mb={4}>
            <Typography variant="h4" fontWeight={800} color="text.primary">
              Admin Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Authorized access only. Please enter your credentials.
            </Typography>
          </Stack>

          {error && (
            <Alert
              severity="error"
              variant="outlined"
              sx={{ mb: 3, borderRadius: 3 }}
            >
              Invalid username or password.
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' },
                }}
              >
                {isLoading ? 'Verifying...' : 'Sign In to Portal'}
              </Button>
            </Stack>
          </Box>

          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', mt: 6, textAlign: 'center' }}
          >
            BH Hunter Boarding House Management System
            <br />
            Ormoc City Capstone Project 2024
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

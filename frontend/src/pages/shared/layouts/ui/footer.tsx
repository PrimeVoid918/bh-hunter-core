import React from 'react';
import {
  Box,
  Typography,
  Link,
  Container,
  Stack,
  Divider,
  useTheme,
} from '@mui/material';
import { Link as LinkRouterDom } from 'react-router-dom';
import logoService from '@/assets/logo/logo.service';
import EmailIcon from '@mui/icons-material/Email';

export default function Footer() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const logoUrl = React.useMemo(
    () =>
      logoService.getPng({
        ratio: '1:1',
        theme: isDarkMode ? 'light' : 'dark', // Fixed: logo should contrast the mode
        size: 128,
      }),
    [isDarkMode],
  );

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'outlineVariant',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'center', md: 'flex-start' }}
          spacing={4}
        >
          {/* Brand Column */}
          <Stack spacing={1} alignItems={{ xs: 'center', md: 'flex-start' }}>
            <Box
              component={LinkRouterDom}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <Box
                component="img"
                src={logoUrl}
                alt="Logo"
                sx={{ width: 40, height: 40 }}
              />
              <Typography
                variant="h6"
                sx={{ ml: 1.5, fontWeight: 700, color: 'primary.main' }}
              >
                Hunter
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                textAlign: { xs: 'center', md: 'left' },
                maxWidth: '250px',
                lineHeight: 1.6,
              }}
            >
              Facilitating secure and verified boarding house matchmaking in
              Ormoc City.
            </Typography>
          </Stack>

          {/* Navigation/Admin Links */}
          <Stack direction="row" spacing={{ xs: 4, sm: 8 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Platform
              </Typography>
              <Link
                component={LinkRouterDom}
                to="/download"
                underline="hover"
                color="text.secondary"
                variant="caption"
              >
                Download App
              </Link>
              <Link
                component={LinkRouterDom}
                to="/docs"
                underline="hover"
                color="text.secondary"
                variant="caption"
              >
                API Reference
              </Link>
              <Link
                component={LinkRouterDom}
                to="/pricing"
                underline="hover"
                color="text.secondary"
                variant="caption"
              >
                Pricing
              </Link>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Support
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmailIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                <Link
                  href="mailto:bhhph.online@gmail.com"
                  underline="hover"
                  color="text.secondary"
                  variant="caption"
                  sx={{ fontWeight: 500 }}
                >
                  bhhph.online@gmail.com
                </Link>
              </Stack>
              <Link
                component={LinkRouterDom}
                to="/auth/login"
                underline="hover"
                color="primary.main"
                sx={{ fontWeight: 600, mt: 1 }}
                variant="caption"
              >
                Owner Portal
              </Link>
            </Stack>
          </Stack>

          {/* Legals (Fixed Labels) */}
          <Stack spacing={1} alignItems={{ xs: 'center', md: 'flex-end' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Legal
            </Typography>
            <Link
              component={LinkRouterDom}
              to="/legal#terms"
              underline="hover"
              color="text.secondary"
              variant="caption"
            >
              Terms of Use
            </Link>
            <Link
              component={LinkRouterDom}
              to="/legal#privacy"
              underline="hover"
              color="text.secondary"
              variant="caption"
            >
              Privacy Policy
            </Link>
            {/* <Link
              component={LinkRouterDom}
              to="/legal#consent"
              underline="hover"
              color="text.secondary"
              variant="caption"
            >
              Owner Consent
            </Link> */}
          </Stack>
        </Stack>

        <Divider sx={{ my: 4, borderColor: 'outlineVariant' }} />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            © 2026 BH Hunter Capstone Project. Built for Ormoc City.
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', fontStyle: 'italic' }}
          >
            Proprietary Matchmaking Logic • Powered by PostGIS
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

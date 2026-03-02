import React from 'react';
import {
  Box,
  Typography,
  Container,
  Stack,
  Button,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';
import AndroidIcon from '@mui/icons-material/Android';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SecurityIcon from '@mui/icons-material/Security';
import SmartphoneIcon from '@mui/icons-material/Smartphone';

export default function DownloadsMainPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          {/* LEFT: Value Proposition */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 800,
                    letterSpacing: 2,
                  }}
                >
                  GET THE APP
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    fontFamily: 'Poppins',
                    lineHeight: 1.1,
                    mb: 2,
                  }}
                >
                  Ormoc City's Rooms <br />
                  <span style={{ color: theme.palette.primary.main }}>
                    In Your Pocket.
                  </span>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: 'text.secondary', fontSize: '1.1rem' }}
                >
                  Experience the full power of BH Hunter. Discover, book, and
                  verify your documents seamlessly on our secure Android
                  application.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AndroidIcon />}
                  sx={{ px: 4, py: 2 }}
                >
                  Download APK (v1.0.2)
                </Button>
                <Button variant="outlined" size="large" sx={{ px: 4, py: 2 }}>
                  View Release Notes
                </Button>
              </Stack>

              <Stack direction="row" spacing={3} sx={{ pt: 2 }}>
                <FeatureItem
                  icon={<SecurityIcon sx={{ fontSize: 20 }} />}
                  text="Verified Safe"
                />
                <FeatureItem
                  icon={<SmartphoneIcon sx={{ fontSize: 20 }} />}
                  text="Android 8.0+"
                />
              </Stack>
            </Stack>
          </Grid>

          {/* RIGHT: Visual "Contained" Cards */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{
                p: 4,
                borderRadius: '24px',
                border: '1px solid',
                borderColor: 'outlineVariant',
                bgcolor: 'background.paper',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Scan to Download
              </Typography>

              {/* QR Code Placeholder */}
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  mx: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: 'primary.light',
                  borderRadius: '16px',
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  mb: 3,
                }}
              >
                <QrCode2Icon sx={{ fontSize: 120, opacity: 0.8 }} />
              </Box>

              <Typography variant="caption" color="text.secondary">
                Direct download for Android devices. <br />
                Enable "Install from Unknown Sources" in settings.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

// Small helper for the feature badges
function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ color: 'text.secondary' }}
    >
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {text}
      </Typography>
    </Stack>
  );
}

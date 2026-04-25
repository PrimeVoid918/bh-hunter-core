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
  Alert,
} from '@mui/material';
import AndroidIcon from '@mui/icons-material/Android';
import SecurityIcon from '@mui/icons-material/Security';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import DownloadIcon from '@mui/icons-material/Download';

const APK_VERSION = 'v1.0.2';
const APK_FILE_NAME = `bh-hunter-${APK_VERSION}.apk`;

// Put the APK here in backend:
// BH_Back/public/downloads/bh-hunter-v1.0.2.apk
const APK_URL = `/downloads/${APK_FILE_NAME}`;

// QR should point to the public download page, not directly to the APK.
// This way the QR still works even if APK version changes later.
const DOWNLOAD_PAGE_URL = 'https://bhhph.online/downloads';

const QR_IMAGE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
  DOWNLOAD_PAGE_URL,
)}`;

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

              <Alert
                severity="info"
                variant="outlined"
                sx={{ borderRadius: 3 }}
              >
                Android may ask you to allow installation from your browser
                before installing the APK.
              </Alert>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  component="a"
                  href={APK_URL}
                  download={APK_FILE_NAME}
                  variant="contained"
                  size="large"
                  startIcon={<AndroidIcon />}
                  sx={{ px: 4, py: 2 }}
                >
                  Download APK ({APK_VERSION})
                </Button>

                <Button
                  component="a"
                  href={APK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  size="large"
                  startIcon={<DownloadIcon />}
                  sx={{ px: 4, py: 2 }}
                >
                  Open Download
                </Button>
              </Stack>

              <Stack direction="row" spacing={3} sx={{ pt: 2 }}>
                <FeatureItem
                  icon={<SecurityIcon sx={{ fontSize: 20 }} />}
                  text="Official BH Hunter APK"
                />

                <FeatureItem
                  icon={<SmartphoneIcon sx={{ fontSize: 20 }} />}
                  text="Android 8.0+"
                />
              </Stack>
            </Stack>
          </Grid>

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
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Scan to Download
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Scan this QR code using your Android phone.
              </Typography>

              <Box
                component="img"
                src={QR_IMAGE_URL}
                alt="BH Hunter download QR code"
                sx={{
                  width: 220,
                  height: 220,
                  mx: 'auto',
                  display: 'block',
                  borderRadius: '16px',
                  p: 1.5,
                  bgcolor: 'common.white',
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 3,
                }}
              />

              <Typography variant="caption" color="text.secondary">
                Direct download for Android devices. <br />
                If prompted, enable installation from your browser.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

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

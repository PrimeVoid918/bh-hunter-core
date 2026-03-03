import React from 'react';
import { Box, Typography, Button, Stack, Grid } from '@mui/material';
import CesiumGlobe from './cesium/cesium.globe';
export default function Hero() {
  return (
    <Box
      component="section"
      sx={{
        minHeight: { xs: 'auto', md: '92vh' },
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Grid container sx={{ flexGrow: 1 }}>
        <Grid
          size={{ xs: 12, md: 5 }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: { xs: 4, md: 8 },
            order: { xs: 2, md: 1 },
            borderRight: { md: '1px solid' },
            borderColor: 'outlineVariant',
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}
          >
            Ormoc City • Capstone Project
          </Typography>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.2rem', md: '3.5rem' },
              fontWeight: 800,
              lineHeight: 1.1,
              mb: 3,
              fontFamily: 'Poppins',
            }}
          >
            Find Your Next Home via{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>
              Spatial Discovery
            </Box>
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontSize: '1.1rem',
              color: 'text.secondary',
              mb: 5,
              lineHeight: 1.7,
              maxWidth: '45ch',
            }}
          >
            BH Hunter is a map-centric facilitator connecting tenants and owners
            within Ormoc City. We simplify the initial booking process so you
            can secure your home before you even arrive.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 6 }}
          >
            <Button
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                px: 4,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              Download Android App
            </Button>

            <Button
              variant="outlined"
              size="large"
              href="/api-docs" // Link to Swagger UI
              target="_blank"
              sx={{
                py: 1.5,
                px: 4,
                borderColor: 'outlineVariant',
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'primary.light',
                  borderColor: 'primary.main',
                },
              }}
            >
              API Documentation
            </Button>
          </Stack>

          <Box sx={{ flexGrow: { md: 0.5 } }} />

          <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 'auto' }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.disabled',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              Scroll to explore the Tech Stack
              <Box component="span" sx={{ fontSize: '1.2rem' }}>
                ↓
              </Box>
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={4}
            sx={{
              pt: 4,
              borderTop: '1px solid',
              borderColor: 'outlineVariant',
              opacity: 0.8,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, display: 'block' }}
              >
                MAP-BASED
              </Typography>
              <Typography variant="caption">Spatial View</Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, display: 'block' }}
              >
                VERIFIED
              </Typography>
              <Typography variant="caption">Owner Screening</Typography>
            </Box>
          </Stack>
        </Grid>

        <Grid
          size={{ xs: 12, md: 7 }}
          sx={{
            height: { xs: '45vh', md: 'auto' },
            position: 'relative',
            order: { xs: 1, md: 2 },
            bgcolor: '#000',
          }}
        >
          <Box
            className="safezone"
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              '& > div': {
                position: 'absolute',
                pointerEvents: 'auto',
                bgcolor: 'transparent',
              },
            }}
          >
            {/* <div style={{ width: '100%', height: '10%', top: 0, left: 0 }} />
            <div style={{ width: '100%', height: '30%', bottom: 0, left: 0 }} /> */}
          </Box>

          <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <CesiumGlobe className="cesium-globe" />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

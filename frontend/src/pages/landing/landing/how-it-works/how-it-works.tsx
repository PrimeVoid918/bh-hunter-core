import React from 'react';
import { Box, Typography, Container, Grid, Paper, Stack } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PaymentsIcon from '@mui/icons-material/Payments';

export default function HowItWorks() {
  const steps = [
    {
      title: '1. Spatial Discovery',
      desc: 'Browse live boarding houses in Ormoc City via our interactive MapLibre interface. View room availability and property details instantly.',
      icon: <MapIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    },
    {
      title: '2. Verified Access',
      desc: 'Unlock booking features by completing your profile. Our system requires valid IDs for tenants and permits for owners to ensure a secure, high-integrity marketplace.',
      icon: <VerifiedUserIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    },
    {
      title: '3. Secured Connection',
      desc: "Submit booking requests for specific rooms. Once the owner accepts, secure your 'match' via PayMongo advance payments before final coordination.",
      icon: <PaymentsIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    },
  ];

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 10, md: 15 },
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'outlineVariant',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 800, mb: 2, fontFamily: 'Poppins' }}
          >
            The Matchmaking Process
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: '700px',
              mx: 'auto',
              fontSize: '1.1rem',
            }}
          >
            BH Hunter simplifies the journey from discovery to reservation. We
            focus on bridging the gap between property owners and seekers in
            Ormoc City.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {steps.map((step, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Paper
                sx={{
                  p: 4,
                  height: '100%',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: 'outlineVariant',
                  bgcolor: 'background.default',
                  boxShadow: 'none',
                  transition: '0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.light',
                  },
                }}
              >
                <Stack spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      bgcolor: 'white',
                      border: '1px solid',
                      borderColor: 'outlineVariant',
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, fontFamily: 'Poppins' }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', lineHeight: 1.7 }}
                  >
                    {step.desc}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            mt: 8,
            p: 3,
            borderRadius: '12px',
            bgcolor: 'primary.light',
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'primary.main',
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: 'primary.dark', letterSpacing: 1 }}
          >
            FACILITATION BOUNDARY
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 1, color: 'primary.dark', opacity: 0.8 }}
          >
            Our platform concludes its role once the initial matchmaking and
            advance payment are secured. Long-term tenancy management and legal
            agreements remain external to the system.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

import React from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function PlatformBoundaries() {
  return (
    <Box component="section" sx={{ py: 12, bgcolor: 'background.default' }}>
      <Container maxWidth="md">
        <Paper
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'outlineVariant',
            bgcolor: 'background.paper',
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, mb: 2, textAlign: 'center' }}
          >
            The BH Hunter Scope
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', mb: 6, textAlign: 'center' }}
          >
            Our platform is a <strong>Matchmaking Facilitator</strong>. We
            provide the verified infrastructure for owners and tenants to
            connect, while respecting the dynamic nature of local rental
            agreements.
          </Typography>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2.5}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CheckCircleOutlineIcon fontSize="small" /> System
                  Facilitation
                </Typography>
                <Divider />
                <Typography
                  variant="body2"
                  sx={{ color: 'text.primary', lineHeight: 2 }}
                >
                  <strong>• Verified Ecosystem:</strong> Gated access requiring
                  document approval for all booking/listing actions.
                  <br />
                  <strong>• Spatial Discovery:</strong> Real-time room-level
                  availability tracking across Ormoc City.
                  <br />
                  <strong>• Competitive Booking:</strong> Secure 1-month advance
                  payments via PayMongo to finalize the match.
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2.5}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <ErrorOutlineIcon fontSize="small" /> Human-Led Negotiation
                </Typography>
                <Divider />
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', lineHeight: 2 }}
                >
                  <strong>• Flexible Availability:</strong> Owners maintain
                  final say on room status and "Re-reservation" requests.
                  <br />
                  <strong>• Direct Communication:</strong> Reasons for rejection
                  or cancellation are handled via direct stakeholder input.
                  <br />
                  <strong>• External Management:</strong> Post-booking
                  residency, utilities, and legalities are handled outside the
                  system.
                </Typography>
              </Stack>
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: 6,
              p: 3,
              bgcolor: 'primary.light',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'primary.main',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, color: 'primary.dark', letterSpacing: 1 }}
            >
              🔐 SECURITY NOTICE
            </Typography>
            <Typography variant="body2" sx={{ color: 'primary.dark' }}>
              All "Book Now" and "Add Listing" features are{' '}
              <strong>Locked</strong> until your Profile Verification is
              completed by the platform admin. This ensures a scam-free
              environment for the Ormoc City community.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

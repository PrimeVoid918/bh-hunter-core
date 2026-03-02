import React from 'react';
import { Box, Typography, Grid, Container, Paper, Stack } from '@mui/material';
import Icon from 'tech-stack-icons';
import { techStackJson } from './techStachArray';

export default function TechStack() {
  return (
    <Box component="section" sx={{ py: 10, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}
          >
            The Engineering Behind BH Hunter
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', maxWidth: '700px', mx: 'auto' }}
          >
            A modern, containerized architecture designed to handle complex
            geospatial queries and high-concurrency booking requests in Ormoc
            City.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 8 }}>
          {techStackJson.map((tech, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'outlineVariant',
                  borderRadius: '16px',
                  boxShadow: 'none',
                  transition: '0.2s',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    borderColor: 'primary.main',
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <Box sx={{ width: 48, height: 48, mb: 2 }}>
                  <Icon
                    name={tech.logo === 'reactNative' ? 'reactjs' : tech.logo}
                    style={{ width: '100%' }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 1, fontSize: '1rem' }}
                >
                  {tech.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', lineHeight: 1.6 }}
                >
                  {tech.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper
          sx={{
            p: { xs: 3, md: 6 },
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}
              >
                Spatial-First Intelligence
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.7 }}
              >
                BH Hunter is built on a{' '}
                <strong>Trust-First Architecture</strong>. While our
                <strong> Android Ecosystem</strong> provides the
                high-performance
                <strong> MapLibre</strong> interface for seamless discovery, our
                <strong> Web Governance Engine</strong> ensures every
                participant is verified.
                <br />
                <br />
                We employ a <strong>
                  multi-step verification protocol
                </strong>{' '}
                for both Owner Certificates and Tenant IDs, creating a secure,
                vetted marketplace. By bridging advanced{' '}
                <strong>PostGIS spatial intelligence</strong> with rigorous
                platform integrity checks, we ensure that every listing in Ormoc
                City isn't just a coordinate—it’s a verified opportunity.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: 'primary.light',
                    borderRadius: '100px',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: 'primary.dark' }}
                  >
                    GEOSPATIAL QUERIES
                  </Typography>
                </Box>
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: 'primary.light',
                    borderRadius: '100px',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: 'primary.dark' }}
                  >
                    RESTFUL API
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  p: 2,
                  border: '2px dashed',
                  borderColor: 'outlineVariant',
                  borderRadius: 4,
                  textAlign: 'center',
                  bgcolor: 'background.default',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Mobile App (MapLibre)
                </Typography>
                <Typography variant="h6">↕</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  NestJS API
                </Typography>
                <Typography variant="h6">↕</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  PostgreSQL + PostGIS
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}

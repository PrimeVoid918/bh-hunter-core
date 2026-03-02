import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Stack,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HubIcon from '@mui/icons-material/Hub';

export default function AboutPage() {
  return (
    <Box sx={{ bgcolor: 'background.default', py: { xs: 6, md: 12 } }}>
      <Container maxWidth="lg">
        {/* SECTION 1: THE RESEARCH CONTEXT */}
        <Grid container spacing={4} sx={{ mb: 12 }} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack>
              <Chip
                label="RESEARCH & DEVELOPMENT 2026"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, mb: 2, borderRadius: '8px' }}
              />
              <Typography
                variant="h2"
                sx={{ fontWeight: 800, mb: 3, lineHeight: 1.1 }}
              >
                Solving the{' '}
                <span style={{ color: '#357FC1' }}>Housing Gap</span> in Ormoc
                City.
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'text.secondary', fontSize: '1.1rem', mb: 4 }}
              >
                As documented in our Chapter I, traditional door-to-door
                boarding house hunting is inefficient. BH Hunter transforms this
                "exhaustive search" into a streamlined, localized digital
                experience built on verified spatial data.
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              sx={{
                p: 4,
                bgcolor: 'primary.light',
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 6,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Project Scope
              </Typography>
              <Stack spacing={2}>
                <ScopeDetail label="Location" value="Ormoc City, Leyte" />
                <ScopeDetail
                  label="Target"
                  value="Students & Transient Workers"
                />
                <ScopeDetail
                  label="Core Tech"
                  value="PostGIS + NestJS + React Native"
                />
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Typography
          variant="h4"
          sx={{ fontWeight: 800, textAlign: 'center', mb: 6 }}
        >
          The Gap Analysis
        </Typography>
        <Grid
          container
          spacing={0}
          sx={{
            borderRadius: 6,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'outlineVariant',
            mb: 12,
          }}
        >
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 6, bgcolor: 'white' }}>
              <Typography
                variant="h6"
                color="error"
                sx={{ fontWeight: 800, mb: 4 }}
              >
                The Traditional Struggle
              </Typography>
              <Stack spacing={3}>
                <Point text="Reliance on word-of-mouth and outdated physical advertisements." />
                <Point text="Manual ocular inspections wasting time and transportation costs." />
                <Point text="Lack of standardized amenities and pricing verification." />
              </Stack>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 6, bgcolor: 'primary.light' }}>
              <Typography
                variant="h6"
                color="primary"
                sx={{ fontWeight: 800, mb: 4 }}
              >
                The BH Hunter Solution
              </Typography>
              <Stack spacing={3}>
                <Point text="Centralized directory with interactive MapLibre navigation." />
                <Point text="Real-time availability updates via Owner Management Portals." />
                <Point
                  text="Gated document verification ensuring legitimacy."
                  isSuccess
                />
              </Stack>
            </Box>
          </Grid>
        </Grid>

        <Paper sx={{ p: { xs: 4, md: 8 }, borderRadius: 6, mb: 12 }}>
          <Stack alignItems="center" spacing={2} sx={{ mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Methodology & Architecture
            </Typography>
            <Typography color="text.secondary">
              Engineered with the V-Model for maximum reliability.
            </Typography>
          </Stack>

          <Grid container spacing={4}>
            <MethodologyCard
              icon={<ExploreIcon />}
              title="Spatial Discovery"
              desc="Utilizing PostGIS for high-accuracy coordinate indexing within Ormoc's 613.60 km² area."
            />
            <MethodologyCard
              icon={<VerifiedUserIcon />}
              title="Role-Based Security"
              desc="Secure JWT authentication and administrative permit validation (BIR/DTI/SEC)."
            />
            <MethodologyCard
              icon={<HubIcon />}
              title="Seamless Integration"
              desc="A unified backend linking mobile tenants, web admins, and PayMongo gateways."
            />
          </Grid>
        </Paper>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 4 }}>
            Developed By
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={8}
            justifyContent="center"
            alignItems="center"
          >
            <Researcher name="Edward Camagong" role="Full-Stack Engineer" />
            <Researcher name="Hanz Vilo Mari Rufin" role="UI/UX & Architect" />
          </Stack>
          <Divider sx={{ my: 6 }} />
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', letterSpacing: 1.5 }}
          >
            WESTERN LEYTE COLLEGE OF ORMOC CITY, INC. • BS INFORMATION
            TECHNOLOGY 2026
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

// --- helper components ---

function ScopeDetail({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.7 }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 800 }}>
        {value}
      </Typography>
    </Stack>
  );
}

function Point({ text, isSuccess }: { text: string; isSuccess?: boolean }) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Typography
        sx={{
          color: isSuccess ? 'primary.main' : 'error.main',
          fontWeight: 900,
        }}
      >
        {isSuccess ? '✓' : '✕'}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', fontWeight: 500 }}
      >
        {text}
      </Typography>
    </Stack>
  );
}

function MethodologyCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Grid size={{ xs: 12, md: 4 }}>
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Box sx={{ color: 'primary.main', mb: 2 }}>{icon}</Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {desc}
        </Typography>
      </Box>
    </Grid>
  );
}

function Researcher({ name, role }: { name: string; role: string }) {
  return (
    <Stack spacing={1} alignItems="center">
      <Avatar
        sx={{
          width: 80,
          height: 80,
          bgcolor: 'primary.main',
          fontSize: '1.5rem',
          fontWeight: 800,
        }}
      >
        {name[0]}
      </Avatar>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {name}
        </Typography>
        <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
          {role}
        </Typography>
      </Box>
    </Stack>
  );
}

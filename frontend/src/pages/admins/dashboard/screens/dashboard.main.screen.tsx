import React from 'react';
import {
  Grid,
  Typography,
  Stack,
  Box,
  Paper,
  LinearProgress,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Users,
  Home,
  ReceiptText,
  Star,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react';
import { useGetOverviewMetricsQuery } from '@/infrastructure/metrics/metric.redux.api';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'secondary';
}

const StatCard = ({ title, value, subtext, icon, color }: StatCardProps) => {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Stack spacing={0.5}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {subtext}
          </Typography>
        </Stack>
        <Box
          sx={{
            p: 1.5,
            borderRadius: '12px',
            bgcolor: `${theme.palette[color].main}15`,
            color: `${theme.palette[color].main}`,
            display: 'flex',
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
};

export default function DashboardMainScreen() {
  const theme = useTheme();
  const {
    data: metrics,
    isLoading,
    isError,
  } = useGetOverviewMetricsQuery({ timeframe: 'month' });

  if (isLoading)
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: '60vh' }}
      >
        <CircularProgress color="primary" thickness={5} />
        <Typography sx={{ mt: 2, fontWeight: 700, color: 'text.secondary' }}>
          Syncing Platform Data...
        </Typography>
      </Stack>
    );

  if (isError)
    return (
      <Alert
        severity="error"
        variant="outlined"
        sx={{ borderRadius: '12px', fontWeight: 600 }}
      >
        Failed to load system metrics. Please check server connection.
      </Alert>
    );

  const ownerProgress = metrics
    ? (metrics.users.owners.verified / metrics.users.owners.total) * 100
    : 0;
  const tenantProgress = metrics
    ? (metrics.users.tenants.verified / metrics.users.tenants.total) * 100
    : 0;

  return (
    <Box sx={{ width: '100%', display: 'block' }}>
      {/* HEADER */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -1 }}>
            System Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time performance metrics for **BH Hunter** (Ormoc City)
          </Typography>
        </Box>
      </Stack>

      {/* PRIMARY STATS ROW */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={metrics?.users.total ?? 0}
            subtext={`${metrics?.users.tenants.total} Tenants / ${metrics?.users.owners.total} Owners`}
            icon={<Users size={22} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={metrics?.bookings.totalBookings ?? 0}
            subtext="Lifetime requests"
            icon={<ReceiptText size={22} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Market Value"
            value={`₱${(metrics?.payments.revenue ?? 0).toLocaleString()}`}
            subtext="Processed payments"
            icon={<Home size={22} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Rating"
            value={metrics?.reviews.averageRating.toFixed(1) ?? '0.0'}
            subtext={`Across ${metrics?.reviews.totalReviews} reviews`}
            icon={<Star size={22} />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* SECOND ROW: VERIFICATION & INVENTORY */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={3}>
              <ShieldCheck size={20} color={theme.palette.primary.main} />
              <Typography variant="subtitle1" fontWeight={700}>
                Verification Integrity
              </Typography>
            </Stack>

            <Stack spacing={3}>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" fontWeight={700}>
                    Owner Verification
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="primary.main"
                  >
                    {metrics?.users.owners.verified}/
                    {metrics?.users.owners.total} Approved
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={ownerProgress}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'background.default',
                    border: `1px solid ${theme.palette.outlineVariant}`,
                  }}
                />
              </Box>

              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  mb={1}
                  gap={2}
                >
                  <Typography variant="body2" fontWeight={700}>
                    Tenant Verification
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="secondary.main"
                  >
                    {metrics?.users.tenants.verified}/
                    {metrics?.users.tenants.total} Approved
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={tenantProgress}
                  color="secondary"
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'background.default',
                    border: `1px solid ${theme.palette.outlineVariant}`,
                  }}
                />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={3}>
              <ClipboardCheck size={20} color={theme.palette.primary.main} />
              <Typography variant="subtitle1" fontWeight={700}>
                Inventory Snapshot
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.outlineVariant}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                  >
                    Available Houses
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    color="primary.main"
                  >
                    {metrics?.properties.boardingHouses.available}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.outlineVariant}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                  >
                    Total Rooms
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {metrics?.properties.totalRooms}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                  sx={{ display: 'block', mb: 1.5 }}
                >
                  ROOM TYPE DISTRIBUTION
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {metrics?.properties.rooms.types.map((t) => (
                    <Box
                      key={t.roomType}
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        // FIX: Use the theme's paper color instead of hardcoded 'white'
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        // This will use your #CCCCCC in light and remain visible in dark
                        borderColor: 'outlineVariant',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        // Added a hover effect to match your M3 design language
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                        }}
                      />
                      <Typography
                        variant="inherit"
                        sx={{ color: 'text.primary' }}
                      >
                        {t.roomType.toUpperCase()}: {t._count.roomType}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

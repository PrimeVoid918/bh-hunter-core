import React from 'react';
import {
  Grid,
  Typography,
  Stack,
  Box,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  PeopleAltOutlined,
  HomeWorkOutlined,
  ReceiptLongOutlined,
  StarBorderOutlined,
} from '@mui/icons-material';
import { useGetOverviewMetricsQuery } from '@/infrastructure/metrics/metric.redux.api';

// Stat Card Component for reuse
const StatCard = ({ title, value, subtext, icon, color }: any) => (
  <Card
    sx={{ height: '100%', border: '1px solid', borderColor: 'outlineVariant' }}
  >
    <CardContent>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Stack spacing={0.5}>
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight={700}
          >
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subtext}
          </Typography>
        </Stack>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 3,
            bgcolor: `${color}.light`,
            color: `${color}.main`,
            display: 'flex',
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default function DashboardMainScreen() {
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
        <CircularProgress />
        <Typography sx={{ mt: 2, fontWeight: 600 }}>
          Loading System Metrics...
        </Typography>
      </Stack>
    );

  if (isError)
    return (
      <Alert severity="error">
        Failed to load system metrics. Please check server connection.
      </Alert>
    );

  return (
    <Stack spacing={4}>
      {/* HEADER */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
      >
        <Stack>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            System Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time performance metrics for BH Hunter (Ormoc City)
          </Typography>
        </Stack>
      </Stack>

      {/* TOP ROW: PRIMARY STATS */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Users"
            value={metrics?.users.total ?? 0}
            subtext={`${metrics?.users.tenants.total} Tenants / ${metrics?.users.owners.total} Owners`}
            icon={<PeopleAltOutlined />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Bookings"
            value={metrics?.bookings.totalBookings ?? 0}
            subtext="Lifetime booking requests"
            icon={<ReceiptLongOutlined />}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Market Value"
            value={`₱${metrics?.payments.revenue.toLocaleString() ?? 0}`}
            subtext="Total processed payments"
            icon={<HomeWorkOutlined />}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Rating"
            value={metrics?.reviews.averageRating.toFixed(1) ?? '0.0'}
            subtext={`Across ${metrics?.reviews.totalReviews} reviews`}
            icon={<StarBorderOutlined />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* SECOND ROW: VERIFICATION & PROPERTIES */}
      <Grid container spacing={3}>
        {/* Verification Status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'outlineVariant' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Verification Integrity
              </Typography>
              <Stack spacing={3} sx={{ mt: 2 }}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight={600}>
                      Owner Verification
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {metrics?.users.owners.verified} /{' '}
                      {metrics?.users.owners.total} Approved
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (metrics?.users.owners.verified! /
                        metrics?.users.owners.total!) *
                      100
                    }
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight={600}>
                      Tenant Verification
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {metrics?.users.tenants.verified} /{' '}
                      {metrics?.users.tenants.total} Approved
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (metrics?.users.tenants.verified! /
                        metrics?.users.tenants.total!) *
                      100
                    }
                    color="secondary"
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Property Availability */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'outlineVariant' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Inventory Snapshot
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Available Houses
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {metrics?.properties.boardingHouses.available}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Rooms
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {metrics?.properties.totalRooms}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Room Type Distribution
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                    {metrics?.properties.rooms.types.map((t) => (
                      <Box
                        key={t.roomType}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          bgcolor: 'background.default',
                          border: '1px solid',
                          borderColor: 'outlineVariant',
                          borderRadius: 2,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {t.roomType}: {t._count.roomType}
                      </Box>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  useTheme,
  CircularProgress,
  LinearProgress,
  Avatar,
} from '@mui/material';
import { Zap, Target, Star, Users } from 'lucide-react';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Bar,
  ComposedChart,
} from 'recharts';
import { useGetInsightsReportsQuery } from '@/infrastructure/metrics/metric.redux.api';
import DashboardDatePicker from '@/pages/shared/components/dashboard/DashboardDatePicker';

export default function InsightsMainScreen() {
  const theme = useTheme();
  const [filterParams, setFilterParams] = useState<{
    timeframe?: 'week' | 'month';
    from?: string;
    to?: string;
  }>({
    timeframe: 'month',
  });

  const { data, isLoading } = useGetInsightsReportsQuery(filterParams);

  if (isLoading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress color="primary" />
      </Box>
    );

  const statusData = data?.charts.bookingStatus || [];
  const statusColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
  ];

  const formatStatus = (value: string) =>
    value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Box sx={{ p: 1, width: '100%', display: 'block', overflowX: 'hidden' }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, letterSpacing: -0.5 }}
          >
            Platform Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Performance analytics for BH-Hunter
          </Typography>
        </Box>
        <DashboardDatePicker
          onFilterChange={(params) => setFilterParams(params)}
        />
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2} mb={3}>
        {[
          {
            label: 'Health Score',
            value: `${data?.insights.healthScore}/100`,
            icon: <Zap size={20} />,
            color: theme.palette.warning.main,
          },
          {
            label: 'Conversion',
            value: `${((data?.kpis.conversionRate || 0) * 100).toFixed(1)}%`,
            icon: <Target size={20} />,
            color: theme.palette.primary.main,
          },
          {
            label: 'Avg Rating',
            value: data?.kpis.averageRating.toFixed(1),
            icon: <Star size={20} />,
            color: theme.palette.secondary.main,
          },
          {
            label: 'Active Subs',
            value: data?.kpis.activeSubscriptions,
            icon: <Users size={20} />,
            color: theme.palette.success.main,
          },
        ].map((kpi, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: `${kpi.color}15`,
                  color: kpi.color,
                }}
              >
                {kpi.icon}
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  {kpi.label}
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  {kpi.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Funnel */}
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Paper
            sx={{
              p: 3,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} mb={3}>
              Conversion Funnel
            </Typography>
            <Stack spacing={3} sx={{ flexGrow: 1, justifyContent: 'center' }}>
              {[
                {
                  label: 'Awaiting Payment',
                  value: data?.funnel.awaitingPayment,
                  color: theme.palette.warning.main,
                },
                {
                  label: 'Completed',
                  value: data?.funnel.completed,
                  color: theme.palette.success.main,
                },
                {
                  label: 'Failed/Dropped',
                  value: data?.funnel.failed,
                  color: theme.palette.error.main,
                },
              ].map((step, i) => (
                <Box key={i}>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" fontWeight={700}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {step.value}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={
                      ((step.value || 0) / (data?.kpis.totalBookings || 1)) *
                      100
                    }
                    sx={{
                      height: 8,
                      borderRadius: 5,
                      bgcolor: 'background.default',
                      '& .MuiLinearProgress-bar': { bgcolor: step.color },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Status Distribution Pie */}
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Paper
            sx={{
              p: 3,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} mb={1}>
              Status Distribution
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 240,
                mt: 2,
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={70}
                    paddingAngle={8}
                    nameKey="status"
                    dataKey="count"
                    isAnimationActive={true}
                  >
                    {statusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={statusColors[index % statusColors.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: `1px solid ${theme.palette.outlineVariant}`,
                      boxShadow: 'none',
                    }}
                    formatter={(value, name) => [
                      value,
                      formatStatus(name as string),
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    formatter={(value) => (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {formatStatus(value)}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Top 10 Owners */}
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Paper
            sx={{
              width: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.outlineVariant}`,
                bgcolor: 'background.default',
              }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                Top 10 Contributors
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5 }}>
              {data?.tables.topOwners.map((owner, idx) => (
                <Stack
                  key={idx}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    mb: 0.5,
                    p: 1,
                    borderRadius: '8px',
                    '&:hover': { bgcolor: 'primary.light' },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: '0.7rem',
                        bgcolor: 'primary.main',
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </Avatar>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                      sx={{ maxWidth: '110px' }}
                    >
                      {owner.ownerName}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="primary.main"
                  >
                    ₱{owner.revenue.toLocaleString()}
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Performance Trend */}
        <Grid
          item
          xs={12}
          sx={{ width: '100%', flexBasis: '100%', minWidth: 0 }}
        >
          <Paper sx={{ p: 3, width: '100%', minWidth: 0 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Performance Trend
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Revenue and Bookings over time
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ width: '100%', height: 350, minWidth: 0 }}>
              <ResponsiveContainer width="99%" height="100%">
                <ComposedChart data={data?.charts.revenueTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={theme.palette.outlineVariant}
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontFamily: 'Poppins' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontFamily: 'Poppins' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: `1px solid ${theme.palette.outlineVariant}`,
                      boxShadow: 'none',
                      fontFamily: 'Poppins',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    fill={`${theme.palette.primary.main}10`}
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                  />
                  <Bar
                    dataKey="bookings"
                    barSize={30}
                    fill={theme.palette.secondary.main}
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

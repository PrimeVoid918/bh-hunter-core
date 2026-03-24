import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  useTheme,
  Divider,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material';
import { TrendingUp, CreditCard, Clock, Wallet } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useGetFinancialReportsQuery } from '@/infrastructure/metrics/metric.redux.api';
import DashboardDatePicker from '@/pages/shared/components/dashboard/DashboardDatePicker';

export default function FinancialDashboard() {
  const theme = useTheme();

  const [filterParams, setFilterParams] = useState<{
    timeframe?: 'week' | 'month';
    from?: string;
    to?: string;
  }>({ timeframe: 'month' });

  const { data, isLoading } = useGetFinancialReportsQuery(filterParams);

  if (isLoading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress color="primary" thickness={5} />
      </Box>
    );

  const stats = [
    {
      label: 'Total Revenue',
      value: `₱${data?.totalRevenue?.toLocaleString()}`,
      icon: <TrendingUp size={20} />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Settled (Paid)',
      value: `₱${data?.totalPaid?.toLocaleString()}`,
      icon: <CreditCard size={20} />,
      color: theme.palette.success.main,
    },
    {
      label: 'Pending Payout',
      value: `₱${data?.totalPending?.toLocaleString()}`,
      icon: <Clock size={20} />,
      color: theme.palette.warning.main,
    },
    {
      label: 'Active Subs',
      value: data?.totalSubscriptions,
      icon: <Wallet size={20} />,
      color: theme.palette.secondary.main,
    },
  ];

  const revenueMixData = [
    {
      name: 'Bookings',
      value: data?.bookingRevenue || 0,
      color: theme.palette.primary.main,
    },
    {
      name: 'Subscriptions',
      value: data?.subscriptionRevenue || 0,
      color: theme.palette.secondary.main,
    },
  ];

  return (
    <Box sx={{ p: 1, width: '100%', display: 'block', overflowX: 'hidden' }}>
      {/* Header Section */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -1 }}>
            Financial Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Revenue streams and payment status for BH-Hunter.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <DashboardDatePicker
            onFilterChange={(params) => setFilterParams(params)}
          />

          {/* <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            sx={{ fontWeight: 700, px: 3 }}
          >
            Export
          </Button> */}
        </Stack>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: `${stat.color}15`,
                    color: stat.color,
                    display: 'flex',
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase' }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {stat.value}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Bottom Activity Distribution */}
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} mb={3}>
              Booking Volume per Transaction Point
            </Typography>

            <Box sx={{ flexGrow: 1, width: '100%', minHeight: 250 }}>
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={data?.timeseries}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={theme.palette.outlineVariant}
                    opacity={0.3}
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
                    cursor={{ fill: theme.palette.primary.light, opacity: 0.1 }}
                    contentStyle={{
                      fontFamily: 'Poppins',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="bookings"
                    fill={theme.palette.primary.main}
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                  <Bar
                    dataKey="subscriptions"
                    fill={theme.palette.secondary.main}
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Revenue Mix (Pie Chart) */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '450px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Revenue Source Mix
            </Typography>
            <Typography variant="caption" color="text.secondary" mb={2}>
              Booking vs Subscription fees
            </Typography>

            <Box sx={{ flexGrow: 1, position: 'relative' }}>
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueMixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {revenueMixData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      fontFamily: 'Poppins',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    formatter={(value) => (
                      <span
                        style={{
                          fontFamily: 'Poppins',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>

              <Box
                sx={{
                  position: 'absolute',
                  top: '42%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" fontWeight={800} color="text.primary">
                  ₱
                  {(
                    (data?.bookingRevenue || 0) +
                    (data?.subscriptionRevenue || 0)
                  ).toLocaleString()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  Total Inflow
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

            <Stack spacing={1.5}>
              <Box display="flex" justifyContent="space-between">
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                >
                  PAYOUT SUCCESS RATE
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  color="success.main"
                >
                  {data?.statusBreakdown
                    ? Math.round(
                        (data.statusBreakdown.paid /
                          (data.statusBreakdown.paid +
                            data.statusBreakdown.failed || 1)) *
                          100,
                      )
                    : 0}
                  %
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={92}
                sx={{
                  height: 8,
                  borderRadius: 5,
                  bgcolor: 'background.default',
                  border: `1px solid ${theme.palette.outlineVariant}`,
                  '& .MuiLinearProgress-bar': { borderRadius: 5 },
                }}
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Main Revenue Trend Chart */}
        <Grid
          item
          xs={12}
          sx={{ width: '100%', flexBasis: '100%', minWidth: 0 }}
        >
          <Paper
            sx={{
              p: 3,
              height: '450px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={3}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Revenue & Growth Trend
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Daily performance ({filterParams.timeframe || 'Custom Range'})
                </Typography>
              </Box>
              <Chip
                label="Live"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700, borderRadius: '6px' }}
              />
            </Stack>

            <Box sx={{ flexGrow: 1, width: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={data?.timeseries}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={theme.palette.primary.main}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor={theme.palette.primary.main}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
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
                    tick={{
                      fontSize: 11,
                      fill: theme.palette.text.secondary,
                      fontFamily: 'Poppins',
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: theme.palette.text.secondary,
                      fontFamily: 'Poppins',
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      bgcolor: theme.palette.background.paper,
                      borderRadius: '12px',
                      border: `1px solid ${theme.palette.outlineVariant}`,
                      boxShadow: 'none',
                      fontFamily: 'Poppins',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

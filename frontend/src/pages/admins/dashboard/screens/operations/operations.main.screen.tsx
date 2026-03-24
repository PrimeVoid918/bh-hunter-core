import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  LinearProgress,
  TablePagination,
  TableSortLabel,
  Divider,
} from '@mui/material';
import {
  Users,
  BadgeCheck,
  ShieldAlert,
  Home,
  DoorOpen,
  BookCheck,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useGetOperationsReportsQuery } from '@/infrastructure/metrics/metric.redux.api';

export default function OperationsMainScreen() {
  const theme = useTheme();
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
  ];
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<string>('totalRevenue');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useGetOperationsReportsQuery(
    {
      timeframe: 'month',
      page: page + 1,
      pageSize: rowsPerPage,
      sortBy: orderBy,
      sortOrder: order,
    },
    { pollingInterval: 60000 },
  );

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  if (isLoading) return <LinearProgress />;

  const verificationRate = data?.totalOwners
    ? Math.round((data.verifiedOwners / data.totalOwners) * 100)
    : 0;

  const pieData = [
    {
      name: 'Verified',
      value: data?.verifiedOwners || 0,
      color: theme.palette.primary.main,
    },
    {
      name: 'Unverified',
      value: data?.unverifiedOwners || 0,
      color: theme.palette.outlineVariant,
    },
  ];

  return (
    <Box sx={{ p: 1, width: '100%', display: 'block', overflowX: 'hidden' }}>
      <Stack mb={4}>
        <Typography variant="h4" fontWeight={700}>
          Platform Operations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time owner performance and compliance tracking.
        </Typography>
      </Stack>

      {/* Top Level KPIs */}
      <Grid container spacing={3} mb={3}>
        {[
          {
            label: 'Total Owners',
            value: data?.totalOwners,
            icon: <Users size={20} />,
            color: theme.palette.primary.main,
          },
          {
            label: 'Verified Accounts',
            value: data?.verifiedOwners,
            icon: <BadgeCheck size={20} />,
            color: theme.palette.success.main,
          },
          {
            label: 'Pending Docs',
            value: data?.unverifiedOwners,
            icon: <ShieldAlert size={20} />,
            color: theme.palette.warning.main,
          },
        ].map((stat, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Paper
              sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  backgroundColor: `${stat.color}15`,
                  color: stat.color,
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {stat.label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Main Grid: Aligned Charts & Table */}
      <Grid container spacing={3} alignItems="stretch">
        {/* Compliance Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: { md: '300px' },
              overflow: 'hidden',
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                Compliance Health
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
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      isAnimationActive={true}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
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
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Visual Anchor - Absolute centered */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none', // Allows tooltip to work even when hovering text
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ lineHeight: 1 }}
                  >
                    {verificationRate}%
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: 1,
                      fontSize: '0.65rem',
                    }}
                  >
                    TRUST
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Stack spacing={2} mt={2}>
              <Divider sx={{ borderStyle: 'dashed' }} />
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.outlineVariant}`,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    PLATFORM GOAL
                  </Typography>
                  <Typography variant="caption" fontWeight={700}>
                    95%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={verificationRate}
                  sx={{
                    height: 6,
                    borderRadius: 5,
                    bgcolor: 'outlineVariant',
                    '& .MuiLinearProgress-bar': { borderRadius: 5 },
                  }}
                />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Performance Table */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                p: 2.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Owner Performance Matrix
              </Typography>
              <Chip
                label="Real-time"
                size="small"
                color="success"
                variant="outlined"
                sx={{ borderRadius: '6px', fontWeight: 700 }}
              />
            </Box>

            <TableContainer sx={{ flexGrow: 1 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      '& th': {
                        backgroundColor: 'background.paper',
                        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
                        fontWeight: 700,
                        py: 1.5,
                      },
                    }}
                  >
                    <TableCell>Owner & Properties</TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={orderBy === 'totalBoardingHouses'}
                        direction={
                          orderBy === 'totalBoardingHouses' ? order : 'asc'
                        }
                        onClick={() => handleRequestSort('totalBoardingHouses')}
                      >
                        BH Count
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={orderBy === 'totalRooms'}
                        direction={orderBy === 'totalRooms' ? order : 'asc'}
                        onClick={() => handleRequestSort('totalRooms')}
                      >
                        Units/Rooms
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'totalRevenue'}
                        direction={orderBy === 'totalRevenue' ? order : 'asc'}
                        onClick={() => handleRequestSort('totalRevenue')}
                      >
                        Revenue
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.items.map((owner) => (
                    <TableRow key={owner.ownerId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {owner.ownerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Owner ID: #{owner.ownerId}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Home size={14} color={theme.palette.primary.main} />
                          <Typography variant="body2" fontWeight={600}>
                            {owner.totalBoardingHouses}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                          alignItems="center"
                        >
                          <DoorOpen
                            size={14}
                            color={theme.palette.text.secondary}
                          />
                          <Typography variant="body2">
                            {owner.totalRooms}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={
                            owner.activeSubscriptions > 0
                              ? 'Active'
                              : 'Inactive'
                          }
                          size="small"
                          sx={{
                            fontSize: '10px',
                            height: 18,
                            fontWeight: 700,
                            bgcolor:
                              owner.activeSubscriptions > 0
                                ? 'primary.main'
                                : 'outlineVariant',
                            color:
                              owner.activeSubscriptions > 0
                                ? 'white'
                                : 'text.secondary',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          color="text.primary"
                        >
                          ₱{owner.totalRevenue.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={data?.meta?.totalItems ?? data?.totalOwners ?? 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{ borderTop: `1px solid ${theme.palette.outlineVariant}` }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

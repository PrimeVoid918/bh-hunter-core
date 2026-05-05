import React, { useContext, useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Menu,
  MenuItem,
  Stack,
  useTheme,
  useColorScheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  VerifiedUser as ValidationIcon,
  People as UsersIcon,
  Assignment as LogsIcon,
  AccountCircle,
  ReceiptLong,
  FactCheck,
} from '@mui/icons-material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store/stores';
import { ColorModeContext } from '@/app/config/muiTheme';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  logout,
  selectAuthStatus,
  selectAuthError,
} from '@/infrastructure/auth/auth.redux.slice';

const DRAWER_WIDTH = 260;

export default function AdminSidebarLayout() {
  const dispatch = useDispatch();
  const { user, status: authStatus } = useSelector(
    (state: RootState) => state.auth,
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isLoggingOut = authStatus === 'loading';

  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const isDarkMode = theme.palette.mode === 'dark';
  const ThemeToggle = () => (
    <IconButton
      onClick={colorMode.toggleColorMode}
      sx={{
        ml: 1,
        color:
          theme.palette.mode === 'dark' ? 'secondary.main' : 'text.primary',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      {theme.palette.mode === 'dark' ? (
        <Brightness7Icon sx={{ fontSize: 20 }} />
      ) : (
        <Brightness4Icon sx={{ fontSize: 20 }} />
      )}
    </IconButton>
  );
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    Validation: false,
    Users: false,
  });

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = async () => {
    setAnchorEl(null);

    try {
      dispatch({ type: 'auth/loginStart' });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      dispatch(logout());

      window.location.href = '/auth/login';
    } catch (err: any) {
      dispatch({
        type: 'auth/loginFailure',
        payload: err.message || 'Logout failed',
      });
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      icon: <DashboardIcon />,
      children: [
        { name: 'Overview', link: '/admin' },
        { name: 'Financial', link: '/admin/dashboard/financial' },
        { name: 'Operations', link: '/admin/dashboard/operations' },
        { name: 'Insights', link: '/admin/dashboard/insights' },
      ],
    },
    {
      name: 'Validation',
      icon: <ValidationIcon />,
      children: [
        { name: 'Owners', link: '/admin/validation/owners' },
        { name: 'Tenants', link: '/admin/validation/tenants' },
      ],
    },
    {
      name: 'Users',
      icon: <UsersIcon />,
      children: [
        { name: 'Owners', link: '/admin/users/owners' },
        { name: 'Tenants', link: '/admin/users/tenants' },
      ],
    },
    { name: 'Logs', icon: <LogsIcon />, link: '/admin/logs' },
    {
      name: 'Transactions',
      icon: <ReceiptLong />,
      link: '/admin/transactions',
    },
    {
      name: 'Refund Requests',
      icon: <FactCheck />,
      link: '/admin/request-refund',
    },
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 3 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: -0.5 }}
        >
          BH HUNTER{' '}
          <Box
            component="span"
            sx={{
              fontWeight: 400,
              fontSize: '0.7rem',
              color: 'text.secondary',
              ml: 1,
            }}
          >
            ADMIN
          </Box>
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'outlineVariant' }} />

      <List sx={{ px: 2, py: 2 }}>
        {navItems.map((item) => {
          const isParentActive = item.children?.some(
            (child) => location.pathname === child.link,
          );
          const isActive = location.pathname === item.link || isParentActive;

          if (item.children) {
            return (
              <React.Fragment key={item.name}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => toggleMenu(item.name)}
                    sx={{
                      borderRadius: 2,
                      color: isActive ? 'primary.main' : 'text.primary',
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      primaryTypographyProps={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    />
                    {openMenus[item.name] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse
                  in={openMenus[item.name]}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding sx={{ pl: 4 }}>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.name}
                        onClick={() => navigate(child.link)}
                        selected={location.pathname === child.link}
                        sx={{
                          borderRadius: '100px', // Pill shape for sub-items
                          mb: 0.5,
                          '&.Mui-selected': {
                            bgcolor: 'primary.light',
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.light' },
                          },
                        }}
                      >
                        <ListItemText
                          primary={child.name}
                          primaryTypographyProps={{
                            fontSize: '0.85rem',
                            fontWeight:
                              location.pathname === child.link ? 700 : 500,
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          return (
            <ListItem key={item.name} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.link || '')}
                selected={location.pathname === item.link}
                sx={{
                  borderRadius: '100px',
                  color: isActive ? 'primary.main' : 'text.primary',
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        bgcolor: 'background.default',
        minHeight: '100vh',
      }}
    >
      {/* APP BAR */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'outlineVariant',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" spacing={2} alignItems="center">
            <ThemeToggle />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {user?.firstname} {user?.lastname}
            </Typography>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.8rem',
                }}
              >
                {user?.firstname?.[0]}
                {user?.lastname?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  mt: 1,
                  minWidth: 180, // Slightly wider for better text fit
                  border: '1px solid',
                  borderColor: 'outlineVariant',
                  boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
                },
              }}
            >
              {/* Added a Header for a more "Admin" feel */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {user?.firstname} {user?.lastname}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrator
                </Typography>
              </Box>

              <Divider sx={{ mb: 1, borderColor: 'outlineVariant' }} />

              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  navigate('/admin');
                }}
                sx={{ py: 1, mx: 1, borderRadius: 1.5 }}
              >
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>

              <MenuItem
                disabled={isLoggingOut}
                onClick={async () => {
                  try {
                    dispatch({ type: 'auth/loginStart' });
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                    dispatch(logout());
                    window.location.href = '/auth/login';
                  } catch (err: any) {
                    dispatch({
                      type: 'auth/loginFailure',
                      payload: err.message,
                    });
                  }
                }}
                sx={{
                  py: 1,
                  mx: 1,
                  borderRadius: 1.5,
                  color: 'error.main',
                  '&:hover': { bgcolor: 'error.light' },
                }}
              >
                <ListItemIcon>
                  <LogoutIcon
                    fontSize="small"
                    sx={{
                      color: isLoggingOut ? 'text.disabled' : 'error.main',
                    }}
                  />
                </ListItemIcon>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {isLoggingOut ? 'Signing out...' : 'Logout'}
                </Typography>
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* SIDEBAR DRAWER */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid',
              borderColor: 'outlineVariant',
            },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid',
              borderColor: 'outlineVariant',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* MAIN CONTENT AREA */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minWidth: 0,
          mt: '64px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

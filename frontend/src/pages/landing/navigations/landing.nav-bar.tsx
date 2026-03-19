import React, { useState, useContext, useMemo } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stack,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import logoService from '@/assets/logo/logo.service';
import { LANDING_ROUTES } from './landing.nav-bar.config';
import { useTypedRootNavigation } from '@/app/navigation/RootNavHook';
import { ColorModeContext } from '@/app/config/muiTheme';

export default function LandingNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const navigate = useTypedRootNavigation();

  const isDarkMode = theme.palette.mode === 'dark';

  const logoUrl = useMemo(
    () =>
      logoService.getPng({
        ratio: '1:1',
        theme: isDarkMode ? 'light' : 'dark', // Fixed: logo should contrast the mode
        size: 128,
      }),
    [isDarkMode],
  );

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  // --- Sub-Components ---

  const ThemeToggle = () => (
    <IconButton
      onClick={colorMode.toggleColorMode}
      color="inherit"
      sx={{ ml: 1 }}
    >
      {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );

  const navLinks = LANDING_ROUTES.map((route) => (
    <Typography
      key={route.path}
      component={NavLink}
      to={route.path}
      sx={{
        textDecoration: 'none',
        color: 'text.secondary',
        fontWeight: 500,
        fontSize: '0.95rem',
        transition: 'all 0.2s',
        '&.active': { color: 'primary.main', fontWeight: 600 },
        '&:hover': { color: 'primary.main' },
      }}
    >
      {route.label}
    </Typography>
  ));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider', // Using standard 'divider' token
        color: 'text.primary',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{ justifyContent: 'space-between', height: 70 }}
        >
          {/* 1. Brand Section */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <Box
              component="img"
              src={logoUrl}
              alt="Logo"
              sx={{ width: 40, height: 40 }}
            />
            <Typography
              variant="h6"
              sx={{
                ml: 1.5,
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: -0.5,
              }}
            >
              Hunter
            </Typography>
          </Box>

          {/* 2. Desktop Navigation */}
          <Stack
            direction="row"
            spacing={4}
            sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
          >
            {navLinks}
          </Stack>

          {/* 3. Global Actions (Toggle + Login) */}
          <Stack direction="row" spacing={1} alignItems="center">
            <ThemeToggle />

            <Button
              variant="contained"
              disableElevation
              onClick={() => navigate('/auth/login')}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Admin Portal
            </Button>

            <IconButton
              color="inherit"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </Container>

      {/* Mobile Menu */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        PaperProps={{ sx: { width: 280, p: 2 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        </Box>

        <List>
          {LANDING_ROUTES.map((route) => (
            <ListItem key={route.path} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={NavLink}
                to={route.path}
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: 2,
                  '&.active': {
                    bgcolor: 'primary.light',
                    color: 'primary.dark',
                  },
                }}
              >
                <ListItemText
                  primary={route.label}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Button
          fullWidth
          variant="contained"
          onClick={() => {
            navigate('/auth/login');
            handleDrawerToggle();
          }}
          sx={{ py: 1.5 }}
        >
          Login as Admin
        </Button>
      </Drawer>
    </AppBar>
  );
}

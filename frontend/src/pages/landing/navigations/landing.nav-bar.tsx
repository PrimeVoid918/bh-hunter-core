import React, { useState } from 'react';
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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu'; // Install @mui/icons-material if you haven't
import CloseIcon from '@mui/icons-material/Close';
import logoService from '@/assets/logo/logo.service';
import { LANDING_ROUTES } from './landing.nav-bar.config';
import { useTypedRootNavigation } from '@/app/navigation/RootNavHook';

export default function LandingNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useTypedRootNavigation();

  const logoUrl = logoService.getPng({
    ratio: '1:1',
    theme: 'dark',
    size: 128,
  });

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  // Reusable Nav Links for Desktop & Mobile
  const navLinks = LANDING_ROUTES.map((route) => (
    <Typography
      key={route.path}
      component={NavLink}
      to={route.path}
      onClick={() => setMobileOpen(false)}
      sx={{
        textDecoration: 'none',
        color: 'text.secondary',
        fontWeight: 500,
        fontSize: '0.95rem',
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
        borderColor: 'outlineVariant',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{ justifyContent: 'space-between', height: 70 }}
        >
          {/* Brand/Logo */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
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
              sx={{ ml: 1.5, fontWeight: 700, color: 'primary.main' }}
            >
              Hunter
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Stack
            direction="row"
            spacing={4}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {navLinks}
          </Stack>

          {/* Action Area & Mobile Trigger */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              disableElevation
              onClick={() => navigate('/auth/login')}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                borderRadius: '100px',
              }}
            >
              Login
            </Button>

            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }} // Better open performance on mobile
        PaperProps={{
          sx: {
            width: 280,
            borderLeft: '1px solid',
            borderColor: 'outlineVariant',
            boxShadow: 'none',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        </Box>

        <List sx={{ px: 2 }}>
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
          <Divider sx={{ my: 2 }} />
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              navigate('/auth/login');
              handleDrawerToggle();
            }}
            sx={{ borderRadius: '100px' }}
          >
            Login as Admin
          </Button>
        </List>
      </Drawer>
    </AppBar>
  );
}

import React from 'react';
import { Box } from '@mui/material';
import Hero from './hero';
import Techstack from './tech-stack/techstack';
import HowitWorks from './how-it-works/how-it-works';
import PlatformBoundaries from './platform-boundaries/platform-boundaries';

export default function LandingPage() {
  return (
    <Box
      component="main"
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',

        color: 'text.primary',

        gap: { xs: 4, md: 8 },

        m: 0,
        p: 0,
      }}
    >
      <Hero />
      <Techstack />
      <HowitWorks />
      <PlatformBoundaries />
    </Box>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Stack,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GavelIcon from '@mui/icons-material/Gavel';
import ShieldIcon from '@mui/icons-material/Shield';

import TermsAndConditions from '@/data/TermsAndConditions';
import BHHunterOwnerLegitimacyConsent from '@/data/BHHunterOwnerLegitimacyConsent';

type LegalTab = 'terms' | 'privacy';

export default function LegalPage() {
  const { hash } = useLocation();
  const [activeTab, setActiveTab] = useState<LegalTab>('terms');
  const scrollParentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hash === '#privacy' || hash === '#consent') {
      setActiveTab('privacy');
    } else {
      setActiveTab('terms');
    }
    scrollParentRef.current?.scrollTo(0, 0);
  }, [hash]);

  const activeContent =
    activeTab === 'terms' ? TermsAndConditions : BHHunterOwnerLegitimacyConsent;

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        py: { xs: 4, md: 10 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* left: Sidebar Navigation */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ position: 'sticky', top: 100 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, mb: 3, fontFamily: 'Poppins' }}
              >
                Legal Center
              </Typography>

              <Paper
                sx={{
                  border: '1px solid',
                  borderColor: 'outlineVariant',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <List disablePadding>
                  <ListItemButton
                    selected={activeTab === 'terms'}
                    onClick={() => setActiveTab('terms')}
                    sx={{
                      py: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <GavelIcon fontSize="small" />
                      <ListItemText
                        primary="Terms of Use"
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </Stack>
                  </ListItemButton>

                  <Divider />

                  <ListItemButton
                    selected={activeTab === 'privacy'}
                    onClick={() => setActiveTab('privacy')}
                    sx={{
                      py: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <ShieldIcon fontSize="small" />
                      <ListItemText
                        primary="Privacy Policy"
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </Stack>
                  </ListItemButton>
                </List>
              </Paper>

              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: 'primary.light',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'primary.main',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'primary.dark', fontWeight: 600 }}
                >
                  DPA COMPLIANCE
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'primary.dark', fontSize: '0.75rem', mt: 0.5 }}
                >
                  This platform adheres to Republic Act No. 10173 (Data Privacy
                  Act of 2012).
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* right: Content Display */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Paper
              ref={scrollParentRef}
              sx={{
                p: { xs: 3, md: 6 },
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'outlineVariant',
                minHeight: '600px',
                // Markdown Styling
                '& .markdown-body': {
                  fontFamily: "'Poppins', sans-serif",
                  '& h1': { fontSize: '1.8rem', fontWeight: 800, mb: 2 },
                  '& h2': {
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    mt: 4,
                    mb: 2,
                    color: 'primary.main',
                  },
                  '& p': { color: 'text.secondary', lineHeight: 1.8, mb: 2 },
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    my: 3,
                    '& th, & td': {
                      border: '1px solid',
                      borderColor: 'outlineVariant',
                      p: 1.5,
                      textAlign: 'left',
                      fontSize: '0.85rem',
                    },
                    '& th': { bgcolor: 'background.default' },
                  },
                },
              }}
            >
              <Box className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeContent}
                </ReactMarkdown>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

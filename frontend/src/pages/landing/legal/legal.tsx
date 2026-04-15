import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Stack,
  Collapse,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import ShieldIcon from '@mui/icons-material/Shield';
import PaymentsIcon from '@mui/icons-material/Payments';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';

import {
  useGetTermsQuery,
  useGetPrivacyQuery,
  useGetRefundPoliciesQuery,
  useGetUserLegitimacyConsentPoliciesQuery,
} from '@/infrastructure/policies/policies.redix.api';

type LegalTab = 'terms' | 'privacy' | 'consent' | 'refund';

export default function LegalPage() {
  const { hash } = useLocation();
  const [activeTab, setActiveTab] = useState<LegalTab>('terms');

  // Dynamic sub-types
  const [refundType, setRefundType] = useState<'booking' | 'subscription'>(
    'booking',
  );
  // Updated to match your new API type: 'owner' | 'tenant'
  const [consentType, setConsentType] = useState<'owner' | 'tenant'>('tenant');

  const [refundOpen, setRefundOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);

  const scrollParentRef = useRef<HTMLDivElement>(null);

  // 1. Hook Integration
  const { data: termsHtml, isFetching: isTermsLoading } = useGetTermsQuery();
  const { data: privacyHtml, isFetching: isPrivacyLoading } =
    useGetPrivacyQuery();
  const { data: refundHtml, isFetching: isRefundLoading } =
    useGetRefundPoliciesQuery({ type: refundType });
  const { data: consentHtml, isFetching: isConsentLoading } =
    useGetUserLegitimacyConsentPoliciesQuery({ type: consentType });

  // 2. Active Content Selector
  const getActiveContent = () => {
    switch (activeTab) {
      case 'terms':
        return termsHtml;
      case 'privacy':
        return privacyHtml;
      case 'consent':
        return consentHtml;
      case 'refund':
        return refundHtml;
      default:
        return '';
    }
  };

  const isContentLoading =
    isTermsLoading || isPrivacyLoading || isRefundLoading || isConsentLoading;
  const activeContent = getActiveContent();

  useEffect(() => {
    if (hash === '#privacy') {
      setActiveTab('privacy');
    } else if (hash === '#consent') {
      setActiveTab('consent');
      setConsentOpen(true);
    } else if (hash === '#refund') {
      setActiveTab('refund');
      setRefundOpen(true);
    } else {
      setActiveTab('terms');
    }
    scrollParentRef.current?.scrollTo(0, 0);
  }, [hash]);

  const handleRefundClick = (type: 'booking' | 'subscription') => {
    setActiveTab('refund');
    setRefundType(type);
  };

  const handleConsentClick = (type: 'owner' | 'tenant') => {
    setActiveTab('consent');
    setConsentType(type);
  };

  const NavButton = ({
    icon,
    label,
    onClick,
    active,
    hasDropdown,
    isOpen,
  }: any) => (
    <Button
      fullWidth
      variant={active && !hasDropdown ? 'contained' : 'text'}
      onClick={onClick}
      startIcon={icon}
      endIcon={
        hasDropdown ? (
          isOpen ? (
            <ExpandMoreIcon fontSize="small" />
          ) : (
            <KeyboardArrowRightIcon fontSize="small" />
          )
        ) : null
      }
      sx={{
        justifyContent: 'flex-start',
        px: 3,
        py: 1.5,
        borderRadius: '100px',
        bgcolor: active && !hasDropdown ? 'primary.main' : 'transparent',
        color: active && !hasDropdown ? 'white' : 'text.primary',
        '&:hover': {
          bgcolor: active && !hasDropdown ? 'primary.dark' : 'action.hover',
        },
      }}
    >
      <Box sx={{ flexGrow: 1, textAlign: 'left' }}>{label}</Box>
    </Button>
  );

  const SubItem = ({ label, active, onClick }: any) => (
    <Button
      onClick={onClick}
      sx={{
        justifyContent: 'flex-start',
        borderRadius: '100px',
        fontSize: '0.85rem',
        px: 3,
        py: 1,
        color: active ? 'primary.main' : 'text.secondary',
        bgcolor: active ? 'primary.light' : 'transparent',
        fontWeight: active ? 700 : 500,
        '&:hover': { bgcolor: 'primary.light', opacity: 0.8 },
      }}
    >
      • {label}
    </Button>
  );

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ position: 'sticky', top: 100 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
                Legal Center
              </Typography>

              <Stack
                spacing={0.5}
                sx={{
                  p: 1,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'outlineVariant',
                  borderRadius: '16px',
                }}
              >
                <NavButton
                  icon={<GavelIcon />}
                  label="Terms of Use"
                  active={activeTab === 'terms'}
                  onClick={() => {
                    setActiveTab('terms');
                    setRefundOpen(false);
                    setConsentOpen(false);
                  }}
                />

                <NavButton
                  icon={<ShieldIcon />}
                  label="Privacy Policy"
                  active={activeTab === 'privacy'}
                  onClick={() => {
                    setActiveTab('privacy');
                    setRefundOpen(false);
                    setConsentOpen(false);
                  }}
                />

                <NavButton
                  icon={<PersonSearchIcon />}
                  label="User Consent"
                  active={activeTab === 'consent'}
                  hasDropdown
                  isOpen={consentOpen}
                  onClick={() => {
                    setConsentOpen(!consentOpen);
                    setRefundOpen(false);
                  }}
                />
                <Collapse in={consentOpen} timeout="auto" unmountOnExit>
                  <Stack spacing={0.5} sx={{ mt: 0.5, pl: 2, pb: 1 }}>
                    <SubItem
                      label="Tenant Legitimacy"
                      active={
                        activeTab === 'consent' && consentType === 'tenant'
                      }
                      onClick={() => handleConsentClick('tenant')}
                    />
                    <SubItem
                      label="Owner Verification"
                      active={
                        activeTab === 'consent' && consentType === 'owner'
                      }
                      onClick={() => handleConsentClick('owner')}
                    />
                  </Stack>
                </Collapse>

                <NavButton
                  icon={<PaymentsIcon />}
                  label="Refund Policy"
                  active={activeTab === 'refund'}
                  hasDropdown
                  isOpen={refundOpen}
                  onClick={() => {
                    setRefundOpen(!refundOpen);
                    setConsentOpen(false);
                  }}
                />
                <Collapse in={refundOpen} timeout="auto" unmountOnExit>
                  <Stack spacing={0.5} sx={{ mt: 0.5, pl: 2, pb: 1 }}>
                    <SubItem
                      label="Booking Refunds"
                      active={
                        activeTab === 'refund' && refundType === 'booking'
                      }
                      onClick={() => handleRefundClick('booking')}
                    />
                    <SubItem
                      label="Subscription Refunds"
                      active={
                        activeTab === 'refund' && refundType === 'subscription'
                      }
                      onClick={() => handleRefundClick('subscription')}
                    />
                  </Stack>
                </Collapse>
              </Stack>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 9 }}>
            <Paper
              sx={{
                p: { xs: 3, md: 6 },
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'outlineVariant',
                boxShadow: 'none',
                minHeight: '70vh',
                '& .policy-inject': {
                  fontFamily: "'Poppins', sans-serif",
                  '& h1': {
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    mb: 3,
                    color: 'primary.main',
                  },
                  '& h2': {
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    mt: 4,
                    mb: 2,
                    color: 'text.primary',
                  },
                  '& p': { lineHeight: 1.8, mb: 2, color: 'text.secondary' },
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    my: 3,
                  },
                  '& th, & td': {
                    border: '1px solid',
                    borderColor: 'outlineVariant',
                    p: 1.5,
                  },
                  '& th': { bgcolor: 'background.default' },
                },
              }}
            >
              {isContentLoading ? (
                <Typography
                  sx={{ color: 'text.secondary', fontStyle: 'italic' }}
                >
                  Updating Legal Center...
                </Typography>
              ) : (
                <Box
                  className="policy-inject"
                  dangerouslySetInnerHTML={{ __html: activeContent || '' }}
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

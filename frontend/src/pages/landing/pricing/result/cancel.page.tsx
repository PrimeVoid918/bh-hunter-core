import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stack,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate } from 'react-router-dom';

export default function CancelPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
        <Avatar
          sx={{
            bgcolor: 'error.light',
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 3,
            border: '2px solid',
            borderColor: 'error.main',
          }}
        >
          <CloseIcon sx={{ fontSize: 48, color: 'error.main' }} />
        </Avatar>

        <Typography
          variant="h4"
          fontWeight={800}
          color="error.dark"
          gutterBottom
        >
          Payment Not Completed
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Your subscription was not activated.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ textAlign: 'left', mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={800} gutterBottom>
            What Happened?
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No subscription changes were made. Possible reasons:
          </Typography>

          <List size="small">
            {[
              'You cancelled the checkout process',
              'Your payment method failed',
              'The checkout session expired',
              'Bank authorization was declined',
            ].map((text) => (
              <ListItem key={text} disableGutters>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ErrorOutlineIcon color="disabled" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box
          sx={{
            bgcolor: 'warning.light',
            p: 3,
            borderRadius: 3,
            mb: 4,
            textAlign: 'left',
            opacity: 0.9,
          }}
        >
          <Stack direction="row" spacing={2}>
            <HelpOutlineIcon color="warning" />
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight={800}
                color="warning.dark"
              >
                Need Help?
              </Typography>
              <Typography variant="caption" color="warning.dark">
                If your bank shows a charge but no activation, please contact
                support with your transaction reference.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate('/pricing')}
            >
              Return to Pricing
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}

import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Stack,
  Avatar,
} from '@mui/material';
import { Owner } from '@/infrastructure/owner/owner.types';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';

export const UserInfo = ({ owner }: { owner: Owner }) => {
  const infoItems = [
    {
      icon: <EmailIcon fontSize="small" />,
      label: 'Email',
      value: owner.email,
    },
    {
      icon: <PhoneIcon fontSize="small" />,
      label: 'Phone',
      value: owner.phone_number || 'Not provided',
    },
    {
      icon: <HomeIcon fontSize="small" />,
      label: 'Address',
      value: owner.address || 'Not provided',
    },
  ];

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'outlineVariant',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'primary.main',
            fontWeight: 800,
          }}
        >
          {owner.firstname?.[0]}
          {owner.lastname?.[0]}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {owner.firstname} {owner.lastname}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            @{owner.username} • Owner ID #{owner.id}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

      <Grid container spacing={2}>
        {infoItems.map((item, idx) => (
          <Grid item xs={12} key={idx}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ color: 'primary.main', display: 'flex' }}>
                {item.icon}
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.disabled"
                  sx={{ fontWeight: 700, lineHeight: 1 }}
                >
                  {item.label.toUpperCase()}
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {item.value}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

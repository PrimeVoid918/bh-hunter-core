import {
  Paper,
  Typography,
  Stack,
  Chip,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Import your formatters
import {
  formatVerificationLevel,
  formatEnum, // Using the logic from step 1
  formatStatus,
} from '@/infrastructure/utils/enum-formatter.util';

export const VerificationChecklist = ({ data }: { data: any }) => {
  const isFullyVerified = data.verificationLevel === 'FULLY_VERIFIED';

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'outlineVariant',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="subtitle1" fontWeight={800}>
          Platform Verification
        </Typography>
        <Chip
          // Using your custom formatter
          label={formatVerificationLevel(data.verificationLevel)}
          color={isFullyVerified ? 'success' : 'warning'}
          size="small"
          sx={{ fontWeight: 700, borderRadius: 1 }}
        />
      </Stack>

      {/* 1. Submitted Documents */}
      <Typography
        variant="overline"
        color="text.disabled"
        fontWeight={800}
        sx={{ letterSpacing: 1 }}
      >
        Submitted Documents
      </Typography>
      <List disablePadding sx={{ mb: 2 }}>
        {data.verificationDocuments && data.verificationDocuments.length > 0 ? (
          data.verificationDocuments.map((doc: any) => (
            <ListItem key={doc.id} sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {doc.verificationStatus === 'APPROVED' ? (
                  <CheckCircleIcon color="success" sx={{ fontSize: 18 }} />
                ) : (
                  <HourglassEmptyIcon color="warning" sx={{ fontSize: 18 }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={600}>
                    {formatEnum(doc.verificationType)}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Status: {formatStatus(doc.verificationStatus)}
                  </Typography>
                }
              />
            </ListItem>
          ))
        ) : (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ py: 1, fontStyle: 'italic' }}
          >
            No documents submitted yet.
          </Typography>
        )}
      </List>

      <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

      {/* 2. Missing Documents */}
      <Typography
        variant="overline"
        color="error"
        fontWeight={800}
        sx={{ letterSpacing: 1 }}
      >
        Missing Requirements
      </Typography>
      <List disablePadding>
        {data.missingVerificationDocuments?.length > 0 ? (
          data.missingVerificationDocuments.map((type: string, idx: number) => (
            <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <AddCircleOutlineIcon
                  sx={{ fontSize: 18, color: 'text.disabled' }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" color="text.secondary">
                    {formatEnum(type)}
                  </Typography>
                }
              />
            </ListItem>
          ))
        ) : !isFullyVerified ? (
          <Typography variant="caption" color="text.secondary">
            All types uploaded, awaiting review.
          </Typography>
        ) : (
          <Typography variant="caption" color="success.main" fontWeight={600}>
            Verification Complete.
          </Typography>
        )}
      </List>

      {/* Warning Alert for Restrictions */}
      {!isFullyVerified && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'warning.light',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'warning.main',
            opacity: 0.9,
          }}
        >
          <Stack direction="row" spacing={1.5}>
            <ErrorOutlineIcon color="warning" fontSize="small" />
            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                color="warning.dark"
                display="block"
              >
                Verification Required
              </Typography>
              <Typography
                variant="caption"
                color="warning.dark"
                sx={{ lineHeight: 1.2, display: 'block' }}
              >
                To unlock subscriptions, please upload your permits via the
                <strong> BH Hunter Mobile App</strong>.
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

// UserTableInfo.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Block as SuspendIcon,
  DeleteForever as DeleteIcon,
} from '@mui/icons-material';
import { FindOneOwner } from '@/infrastructure/owner/owner.types';
import { FindOneTenant } from '@/infrastructure/tenants/tenant.types';
import { parseIsoDate } from '@/infrastructure/utils/parseISODate.util';

export type UserTableRow = FindOneOwner | FindOneTenant;

interface UserTableInfoProps {
  rowData: UserTableRow;
  thisTableIsFor: 'OWNER' | 'TENANT';
  onSuspend: (row: UserTableRow) => void;
  onDelete: (row: UserTableRow) => void;
  onCloseParent?: () => void;
}

export default function UserTableInfo({
  rowData,
  thisTableIsFor,
  onSuspend,
  onDelete,
  onCloseParent,
}: UserTableInfoProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(true); // Open by default when modal mounts

  const handleClose = () => {
    setOpen(false);
    onCloseParent?.();
  };

  const fullName =
    `${rowData.firstname ?? ''} ${rowData.lastname ?? ''}`.trim();
  const createdAt = parseIsoDate(rowData.createdAt)?.dateTime ?? 'N/A';
  const updatedAt = parseIsoDate(rowData.updatedAt)?.dateTime ?? 'N/A';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        },
      }}
    >
      {/* Close Button */}
      <Box sx={{ position: 'absolute', right: 12, top: 12, zIndex: 10 }}>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogTitle>{thisTableIsFor} Details</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <InfoRow label="Full Name" value={fullName || '—'} />
          <InfoRow label="Username" value={rowData.username} />
          <InfoRow label="Email" value={rowData.email ?? '—'} />
          {thisTableIsFor === 'TENANT' && (
            <InfoRow
              label="Guardian"
              value={(rowData as FindOneTenant).guardian ?? '—'}
            />
          )}
          {thisTableIsFor === 'OWNER' && (
            <>
              <InfoRow
                label="Phone"
                value={(rowData as FindOneOwner).phone_number ?? '—'}
              />
              <InfoRow
                label="Address"
                value={(rowData as FindOneOwner).address ?? '—'}
              />
              <InfoRow
                label="Age"
                value={(rowData as FindOneOwner).age?.toString() ?? '—'}
              />
              <InfoRow
                label="Consent Accepted"
                value={
                  (rowData as FindOneOwner).policiesAcceptedAt
                    ? parseIsoDate((rowData as FindOneOwner).policiesAcceptedAt)
                        ?.dateOnly
                    : 'No'
                }
              />
              <InfoRow
                label="Legitimacy Consent"
                value={
                  (rowData as FindOneOwner).hasAcceptedPolicies ? 'Yes' : 'No'
                }
              />
            </>
          )}
          <InfoRow
            label="Verification Level"
            value={rowData.verificationLevel ?? '—'}
          />
          <InfoRow
            label="Registration Status"
            value={rowData.registrationStatus ?? '—'}
          />
          <InfoRow label="Is Active" value={rowData.isActive ? 'Yes' : 'No'} />
          <InfoRow label="Created At" value={createdAt} />
          <InfoRow label="Updated At" value={updatedAt} />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<SuspendIcon />}
          onClick={() => onSuspend(rowData)}
        >
          Suspend
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onDelete(rowData)}
        >
          Delete
        </Button>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block' }}
      >
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

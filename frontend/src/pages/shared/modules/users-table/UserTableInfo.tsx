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
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Block as SuspendIcon,
  DeleteForever as DeleteIcon,
} from '@mui/icons-material';
import { FindOneOwner } from '@/infrastructure/owner/owner.types';
import { FindOneTenant } from '@/infrastructure/tenants/tenant.types';
import { parseIsoDate } from '@/infrastructure/utils/parseISODate.util';
import { useGetOneQuery as useGetOneOwnerQuery } from '@/infrastructure/owner/owner.redux.api';

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
  const [open, setOpen] = useState(true);

  const ownerId = Number(rowData.id);

  const { data: ownerDetails, isFetching: isOwnerDetailsFetching } =
    useGetOneOwnerQuery(ownerId, {
      skip: thisTableIsFor !== 'OWNER' || !ownerId,
    });

  const displayData =
    thisTableIsFor === 'OWNER' && ownerDetails ? ownerDetails : rowData;

  const handleClose = () => {
    setOpen(false);
    onCloseParent?.();
  };

  const fullName =
    `${displayData.firstname ?? ''} ${displayData.lastname ?? ''}`.trim() ||
    displayData.username ||
    '—';

  const createdAt = parseIsoDate(displayData.createdAt)?.dateTime ?? 'N/A';
  const updatedAt = parseIsoDate(displayData.updatedAt)?.dateTime ?? 'N/A';

  const isInactive = displayData.isActive === false;

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
      <Box sx={{ position: 'absolute', right: 12, top: 12, zIndex: 10 }}>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography fontWeight={800}>{thisTableIsFor} Details</Typography>

          <Chip
            size="small"
            label={isInactive ? 'Inactive' : 'Active'}
            color={isInactive ? 'error' : 'success'}
          />
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {thisTableIsFor === 'OWNER' && isOwnerDetailsFetching ? (
          <Stack alignItems="center" justifyContent="center" py={4} spacing={2}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">
              Loading full owner details...
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <InfoRow label="Full Name" value={fullName} />
            <InfoRow label="Username" value={displayData.username ?? '—'} />
            <InfoRow label="Email" value={displayData.email ?? '—'} />

            {thisTableIsFor === 'TENANT' && (
              <InfoRow
                label="Guardian"
                value={(displayData as FindOneTenant).guardian ?? '—'}
              />
            )}

            {thisTableIsFor === 'OWNER' && (
              <>
                <InfoRow
                  label="Phone"
                  value={(displayData as FindOneOwner).phone_number ?? '—'}
                />

                <InfoRow
                  label="Address"
                  value={(displayData as FindOneOwner).address ?? '—'}
                />

                <InfoRow
                  label="Age"
                  value={(displayData as FindOneOwner).age?.toString() ?? '—'}
                />

                <InfoRow
                  label="Consent Accepted"
                  value={
                    (displayData as FindOneOwner).policiesAcceptedAt
                      ? (parseIsoDate(
                          (displayData as FindOneOwner).policiesAcceptedAt,
                        )?.dateOnly ?? 'Yes')
                      : 'No'
                  }
                />

                <InfoRow
                  label="Legitimacy Consent"
                  value={
                    (displayData as FindOneOwner).hasAcceptedPolicies
                      ? 'Yes'
                      : 'No'
                  }
                />

                <InfoRow
                  label="Boarding Houses"
                  value={String(
                    (displayData as FindOneOwner).boardingHouses?.length ?? 0,
                  )}
                />

                <InfoRow
                  label="Verification Documents"
                  value={String(
                    (displayData as FindOneOwner).verificationDocuments
                      ?.length ?? 0,
                  )}
                />
              </>
            )}

            <Divider />

            <InfoRow
              label="Verification Level"
              value={displayData.verificationLevel ?? '—'}
            />

            <InfoRow
              label="Registration Status"
              value={displayData.registrationStatus ?? '—'}
            />

            <InfoRow
              label="Is Active"
              value={displayData.isActive ? 'Yes' : 'No'}
            />

            <InfoRow label="Created At" value={createdAt} />
            <InfoRow label="Updated At" value={updatedAt} />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          color={isInactive ? 'success' : 'warning'}
          startIcon={<SuspendIcon />}
          onClick={() => onSuspend(displayData)}
          disabled={thisTableIsFor === 'OWNER' && isOwnerDetailsFetching}
        >
          {isInactive ? 'Unsuspend' : 'Suspend'}
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onDelete(displayData)}
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
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}

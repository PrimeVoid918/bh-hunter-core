import React, { useState } from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Snackbar,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import UsersTable, {
  UserTableRow,
} from '@/pages/shared/modules/users-table/UsersTable';
import {
  useGetAllQuery,
  usePatchMutation,
  useDeleteMutation,
} from '@/infrastructure/owner/owner.redux.api';
import {
  useSuspendOwnerMutation,
  useUnsuspendOwnerMutation,
} from '@/infrastructure/admin/admin.redux.api';
import { selectAdminId } from '@/infrastructure/auth/auth.redux.slice';
import { FindOneOwner } from '@/infrastructure/owner/owner.types';

export default function OwnersTableMainScreen() {
  const navigate = useNavigate();
  const adminId = useSelector(selectAdminId);
  const thisTableIsFor: 'OWNER' = 'OWNER';
  const dispatch = useDispatch();

  const { data, isLoading, isError, error, refetch } = useGetAllQuery();

  const [patchOwner] = usePatchMutation();
  const [deleteOwner] = useDeleteMutation();

  const [suspendOwner, { isLoading: isSuspending }] = useSuspendOwnerMutation();
  const [unsuspendOwner, { isLoading: isUnsuspending }] =
    useUnsuspendOwnerMutation();

  const [selectedOwner, setSelectedOwner] = useState<FindOneOwner | null>(null);
  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  const showToast = (message: string, severity: typeof toast.severity) =>
    setToast({ open: true, message, severity });

  if (!adminId) {
    return (
      <Alert severity="error" variant="outlined" sx={{ borderRadius: 3 }}>
        Security Context Error: Admin ID could not be verified. Please re-login.
      </Alert>
    );
  }

  const getOwnerId = (row: UserTableRow) => {
    return (row as FindOneOwner).id;
  };

  const getOwnerName = (owner?: FindOneOwner | null) => {
    if (!owner) return 'this owner';

    const fullName = `${owner.firstname ?? ''} ${owner.lastname ?? ''}`.trim();

    return fullName || owner.username || owner.email || 'this owner';
  };

  const handleOpenSuspendConfirm = (row: UserTableRow) => {
    setSelectedOwner(row as FindOneOwner);
    setSuspendReason('');
    setConfirmSuspendOpen(true);
  };

  const handleCloseSuspendConfirm = () => {
    if (isSuspending || isUnsuspending) return;

    setConfirmSuspendOpen(false);
    setSelectedOwner(null);
    setSuspendReason('');
  };

  const handleConfirmSuspendToggle = async () => {
    if (!selectedOwner) return;

    const ownerId = getOwnerId(selectedOwner);
    const reason = suspendReason.trim() || undefined;
    const shouldUnsuspend = selectedOwner.isActive === false;

    try {
      if (shouldUnsuspend) {
        await unsuspendOwner({
          adminId: Number(adminId),
          ownerId,
          payload: { reason },
        }).unwrap();

        showToast('Owner unsuspended successfully.', 'success');
      } else {
        await suspendOwner({
          adminId: Number(adminId),
          ownerId,
          payload: { reason },
        }).unwrap();

        showToast('Owner suspended successfully.', 'warning');
      }

      dispatch(
        ownerApi.util.invalidateTags([
          { type: 'Owner', id: ownerId },
          { type: 'Owner', id: 'LIST' },
        ]),
      );

      await refetch();

      setSelectedOwner((prev) =>
        prev
          ? {
              ...prev,
              isActive: shouldUnsuspend,
            }
          : prev,
      );

      handleCloseSuspendConfirm();
    } catch {
      showToast(
        shouldUnsuspend
          ? 'Failed to unsuspend owner.'
          : 'Failed to suspend owner.',
        'error',
      );
    }
  };

  const handleUpdateOwner = async (row: UserTableRow) => {
    try {
      await patchOwner({ id: getOwnerId(row), data: {} }).unwrap();
      showToast('Owner updated successfully.', 'success');
      refetch();
    } catch {
      showToast('Failed to update owner.', 'error');
    }
  };

  const handleDeleteOwner = async (row: UserTableRow) => {
    try {
      await deleteOwner(getOwnerId(row)).unwrap();
      showToast('Owner record deleted.', 'info');
      refetch();
    } catch {
      showToast('Failed to delete owner.', 'error');
    }
  };

  const selectedOwnerName = getOwnerName(selectedOwner);
  const isSelectedOwnerInactive = selectedOwner?.isActive === false;
  const isSubmittingSuspension = isSuspending || isUnsuspending;

  return (
    <Box>
      <Stack spacing={1} mb={4}>
        <Breadcrumbs sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate('/admin')}
            sx={{ cursor: 'pointer' }}
          >
            Dashboard
          </Link>

          <Typography
            color="text.primary"
            sx={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            Maintenance
          </Typography>

          <Typography
            color="text.primary"
            sx={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            Owners
          </Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={800}>
          Owners Maintenance
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Manage owner accounts: suspend, update, or delete records as needed.
        </Typography>
      </Stack>

      <AsyncState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
      >
        <UsersTable
          data={data ?? []}
          thisTableIsFor={thisTableIsFor}
          onSuspend={handleOpenSuspendConfirm}
          onDelete={handleDeleteOwner}
        />
      </AsyncState>

      <Dialog
        open={confirmSuspendOpen}
        onClose={handleCloseSuspendConfirm}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle fontWeight={800}>
          {isSelectedOwnerInactive ? 'Unsuspend Owner' : 'Suspend Owner'}
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {isSelectedOwnerInactive
              ? `Are you sure you want to unsuspend ${selectedOwnerName}? This will reactivate the owner account.`
              : `Are you sure you want to suspend ${selectedOwnerName}? This will mark the owner account as inactive.`}
          </DialogContentText>

          <TextField
            label="Reason (Optional)"
            value={suspendReason}
            onChange={(event) => setSuspendReason(event.target.value)}
            fullWidth
            multiline
            minRows={3}
            disabled={isSubmittingSuspension}
            placeholder={
              isSelectedOwnerInactive
                ? 'Example: Issue resolved or appeal approved'
                : 'Example: Policy violation or suspicious listing activity'
            }
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseSuspendConfirm}
            disabled={isSubmittingSuspension}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color={isSelectedOwnerInactive ? 'success' : 'warning'}
            onClick={handleConfirmSuspendToggle}
            disabled={isSubmittingSuspension}
          >
            {isSubmittingSuspension
              ? 'Processing...'
              : isSelectedOwnerInactive
                ? 'Confirm Unsuspend'
                : 'Confirm Suspension'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

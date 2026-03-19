import React, { useState } from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Snackbar,
  Alert,
  Stack,
} from '@mui/material';
import { useSelector } from 'react-redux';
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
import { selectAdminId } from '@/infrastructure/auth/auth.redux.slice';
import { FindOneOwner } from '@/infrastructure/owner/owner.types';

export default function OwnersTableMainScreen() {
  const navigate = useNavigate();
  const adminId = useSelector(selectAdminId);
  const thisTableIsFor: 'OWNER' = 'OWNER';

  // Queries & mutations
  const { data, isLoading, isError, error, refetch } = useGetAllQuery();
  const [patchOwner] = usePatchMutation();
  const [deleteOwner] = useDeleteMutation();

  // Toast state
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

  // Actions
  const handleUpdateOwner = async (row: UserTableRow) => {
    try {
      await patchOwner({ id: (row as FindOneOwner).id, data: {} }).unwrap();
      showToast(`Owner updated successfully.`, 'success');
      refetch();
    } catch {
      showToast(`Failed to update owner.`, 'error');
    }
  };

  const handleDeleteOwner = async (row: UserTableRow) => {
    try {
      await deleteOwner((row as FindOneOwner).id).unwrap();
      showToast(`Owner record deleted.`, 'info');
      refetch();
    } catch {
      showToast(`Failed to delete owner.`, 'error');
    }
  };

  return (
    <Box>
      {/* Breadcrumbs */}
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

      {/* Table */}
      <AsyncState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
      >
        <UsersTable
          data={data ?? []}
          thisTableIsFor={thisTableIsFor}
          onSuspend={handleUpdateOwner} // you can create a separate suspend function if needed
          onDelete={handleDeleteOwner}
        />
      </AsyncState>

      {/* Toasts */}
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

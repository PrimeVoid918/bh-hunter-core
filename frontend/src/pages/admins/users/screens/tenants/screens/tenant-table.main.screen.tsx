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
} from '@/infrastructure/tenants/tenant.redux.api';
import { selectAdminId } from '@/infrastructure/auth/auth.redux.slice';
import { FindOneTenant } from '@/infrastructure/tenants/tenant.types';

export default function TenantTableMainScreen() {
  const navigate = useNavigate();
  const adminId = useSelector(selectAdminId);
  const thisTableIsFor: 'TENANT' = 'TENANT';

  // Queries & mutations
  const { data, isLoading, isError, error, refetch } = useGetAllQuery();
  const [patchTenant] = usePatchMutation();
  const [deleteTenant] = useDeleteMutation();

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
  const handleUpdateTenant = async (row: UserTableRow) => {
    try {
      await patchTenant({ id: (row as FindOneTenant).id, data: {} }).unwrap();
      showToast(`Tenant updated successfully.`, 'success');
      refetch();
    } catch {
      showToast(`Failed to update tenant.`, 'error');
    }
  };

  const handleDeleteTenant = async (row: UserTableRow) => {
    try {
      await deleteTenant((row as FindOneTenant).id).unwrap();
      showToast(`Tenant record deleted.`, 'info');
      refetch();
    } catch {
      showToast(`Failed to delete tenant.`, 'error');
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
            Tenants
          </Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={800}>
          Tenants Maintenance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage tenant accounts: suspend, update, or delete records as needed.
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
          onSuspend={handleUpdateTenant} // implement suspend logic if needed
          onDelete={handleDeleteTenant}
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

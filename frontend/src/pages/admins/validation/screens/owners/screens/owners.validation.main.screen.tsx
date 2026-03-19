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
import ValidationTable from '@/pages/shared/modules/validation-table/ValidationTable';
import {
  useGetAllQuery,
  useDeleteMutation,
  usePatchMutation,
} from '@/infrastructure/valid-docs/valid-docs.redux.api';
import { VerificationDocumentMetaData } from '@/infrastructure/documents/documents.type';
import { selectAdminId } from '@/infrastructure/auth/auth.redux.slice';

export default function OwnersValidationMainScreen() {
  const navigate = useNavigate();
  const adminId = useSelector(selectAdminId);
  const thisTableIsFor = 'owners';

  // API Hooks
  const { data, isLoading, isError, error, refetch } =
    useGetAllQuery(thisTableIsFor);
  const [deleteDocument] = useDeleteMutation();
  const [patchDocument] = usePatchMutation();

  // Notification State
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = (message: string, severity: typeof toast.severity) =>
    setToast({ open: true, message, severity });

  if (!adminId) {
    return (
      <Alert severity="error" variant="outlined" sx={{ borderRadius: 3 }}>
        Security Context Error: Admin ID could not be verified. Please re-login.
      </Alert>
    );
  }

  const handleApprove = async (row: VerificationDocumentMetaData) => {
    try {
      await patchDocument({
        id: row.id,
        sourceTarget: thisTableIsFor,
        payload: {
          adminId: adminId,
          verificationStatus: 'APPROVED',
        },
      }).unwrap();
      showToast(`${row.verificationType} approved successfully.`, 'success');
    } catch (e) {
      showToast(`Failed to approve ${row.verificationType}.`, 'error');
    }
  };

  const handleReject = async (
    row: VerificationDocumentMetaData,
    rejectReason: string,
  ) => {
    try {
      await patchDocument({
        id: row.id,
        sourceTarget: thisTableIsFor,
        payload: {
          adminId: adminId,
          verificationStatus: 'REJECTED',
          rejectReason: rejectReason,
        },
      }).unwrap();
      showToast(`Document rejected. Reason: ${rejectReason}`, 'warning');
    } catch {
      showToast(`Failed to reject document.`, 'error');
    }
  };

  const handleDelete = async (row: VerificationDocumentMetaData) => {
    try {
      await deleteDocument({
        id: row.id,
        sourceTarget: thisTableIsFor,
        adminId: adminId,
      }).unwrap();
      showToast(`Document record deleted.`, 'info');
    } catch {
      showToast(`Failed to delete record.`, 'error');
    }
  };

  return (
    <Box>
      {/* PAGE HEADER */}
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
            Validation
          </Typography>
          <Typography
            color="text.primary"
            sx={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            Owners
          </Typography>
        </Breadcrumbs>
        <Typography variant="h4" fontWeight={800}>
          Owner Verification
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review legal documents, permits, and IDs submitted by boarding house
          owners.
        </Typography>
      </Stack>

      {/* TABLE SECTION */}
      <AsyncState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
      >
        <ValidationTable
          data={data ?? []}
          thisTableIsFor={thisTableIsFor}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
          onRefreshData={refetch}
        />
      </AsyncState>

      {/* FEEDBACK SNACKBAR */}
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

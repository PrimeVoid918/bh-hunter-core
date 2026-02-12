import React from 'react';
import styled from '@emotion/styled';
import { Box, Button, useColorMode, useToast } from '@chakra-ui/react';
import BaseWrapper from '@/features/shared/layouts/wrappers/base-wrapper';
import AsyncState from '@/features/shared/components/async-state/AsyncState';
import ValidationTable from '@/features/shared/modules/validation-table/ValidationTable';
import {
  useGetAllQuery,
  // usePatchVerificationDocumentMutation,
  useDeleteMutation,
  usePatchMutation,
} from '@/infrastructure/valid-docs/valid-docs.redux.api';
import { VerificationDocumentMetaData } from '@/infrastructure/documents/documents.type';
import { useSelector } from 'react-redux';
import { selectAdminId } from '@/infrastructure/auth/auth.redux.slice';

export default function TenantsValidationainScreen() {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const thisTableIsFor = 'tenants';

  const { data, isLoading, isError, error } = useGetAllQuery('tenants');

  const [deleteDocument] = useDeleteMutation();
  const [patchDocument] = usePatchMutation();

  const adminId = useSelector(selectAdminId);
  if (!adminId) {
    return 'Admin ID could not be loaded';
  }

  // Handlers
  const handleApprove = async (row: VerificationDocumentMetaData) => {
    try {
      await patchDocument({
        id: row.id,
        sourceTarget: thisTableIsFor,
        payload: {
          adminId: adminId,
          verificationStatus: 'APPROVED',
          rejectReason: undefined,
        },
      }).unwrap();
      toast({
        title: 'Approved',
        description: `${row.verificationType} of ${row.user.firstname} ${row.user.lastname} has been approved.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (e: unknown) {
      console.log('error in approve: ', e);
      toast({
        title: 'Error',
        description: `Failed to approve ${row.verificationType} of ${row.user.firstname} ${row.user.lastname}.`,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleReject = async (row: VerificationDocumentMetaData) => {
    try {
      await patchDocument({
        id: row.id,
        sourceTarget: thisTableIsFor,
        payload: {
          adminId: adminId,
          verificationStatus: 'REJECTED',
          rejectReason: undefined,
        },
      }).unwrap();
      toast({
        title: 'Rejected',
        description: `${row.verificationType} of ${row.user.firstname} ${row.user.lastname} has been rejected.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to reject ${row.verificationType} of ${row.user.firstname} ${row.user.lastname}.`,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (row: VerificationDocumentMetaData) => {
    try {
      await deleteDocument({
        id: row.id,
        sourceTarget: thisTableIsFor,
        adminId: adminId,
      }).unwrap();
      toast({
        title: 'Deleted',
        description: `${row.verificationType} of ${row.user.firstname} ${row.user.lastname} has been deleted.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to delete ${row.verificationType} of ${row.user.firstname} ${row.user.lastname}.`,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <ResponsiveContainer colorMode={colorMode}>
      <AsyncState
        isLoading={isLoading}
        isError={isError}
        errorObject={error}
        errorBody={(err, isOpen, onClose) => {
          // Narrow types if possible
          if ('status' in err) {
            if (err.status >= '500') {
              return (
                <Box>
                  🚨 Server error (500): something went wrong on our side.
                </Box>
              );
            }

            if (err.status >= '400') {
              return (
                <>
                  <Box>
                    ⚠️ Client error ({err.status}): maybe bad request or
                    unauthorized.
                    {/* <pre>{JSON.stringify(err.data, null, 2)}</pre> */}
                  </Box>
                  {onClose && (
                    <Button mt={4} onClick={onClose}>
                      Ok
                    </Button>
                  )}
                </>
              );
            }
          }

          // Fallback for unknown error shapes
          return (
            <Box color="gray.500">
              ❓ Unexpected error
              <pre>{JSON.stringify(err, null, 2)}</pre>
            </Box>
          );
        }}
      >
        {/* <ValidationTable data={data ?? []} /> */}
        <ValidationTable
          data={data ?? []}
          thisTableIsFor={thisTableIsFor}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
        />
      </AsyncState>
    </ResponsiveContainer>
  );
}

const ResponsiveContainer = styled(BaseWrapper)<{ colorMode: string }>`
  .datatable {
    /* Scrollable on small screens */
    @media (max-width: 768px) {
      overflow-x: auto;
    }
  }
`;

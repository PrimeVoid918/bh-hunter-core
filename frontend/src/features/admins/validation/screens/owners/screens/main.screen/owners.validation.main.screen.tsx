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
  useApproveMutation,
  useRejectMutation,
} from '@/infrastructure/valid-docs/valid-docs.redux.api';
import { VerificationDocumentMetaData } from '@/infrastructure/documents/documents.type';

export default function OwnersValidationMainScreen() {
  const { colorMode } = useColorMode();
  const toast = useToast();

  const { data, isLoading, isError, error } = useGetAllQuery('owners');
  // const [patchDocument, patchState] = usePatchVerificationDocumentMutation();
  const [approveDocument, {}] = useApproveMutation();
  const [rejectDocument, {}] = useRejectMutation();
  const [deleteDocument] = useDeleteMutation();

  // Handlers
  const handleApprove = async (row: VerificationDocumentMetaData) => {
    try {
      await approveDocument({
        id: row.id,
        sourceTarget: 'owners',
      }).unwrap();
      toast({
        title: 'Approved',
        description: `${row.verificationType} of ${row.ownerFullName} has been approved.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to approve ${row.verificationType} of ${row.ownerFullName}.`,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleReject = async (row: VerificationDocumentMetaData) => {
    try {
      await rejectDocument({
        id: row.id,
        sourceTarget: 'owners',
      }).unwrap();
      toast({
        title: 'Rejected',
        description: `${row.verificationType} of ${row.ownerFullName} has been rejected.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to reject ${row.verificationType} of ${row.ownerFullName}.`,
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
        sourceTarget: 'owners',
      }).unwrap();
      toast({
        title: 'Deleted',
        description: `${row.verificationType} of ${row.ownerFullName} has been deleted.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to delete ${row.verificationType} of ${row.ownerFullName}.`,
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
        errorBody={(err, _, onClose) => {
          if ('status' in err && typeof err.status === 'number') {
            if (err.status >= 500) {
              return (
                <Box>
                  🚨 Server error (500): something went wrong on our side.
                </Box>
              );
            }
            if (err.status >= 400) {
              return (
                <Box>
                  ⚠️ Client error ({err.status}): maybe bad request or
                  unauthorized.
                  {onClose && (
                    <Button mt={4} onClick={onClose}>
                      Ok
                    </Button>
                  )}
                </Box>
              );
            }
          }
          return (
            <Box color="gray.500">
              ❓ Unexpected error
              <pre>{JSON.stringify(err, null, 2)}</pre>
            </Box>
          );
        }}
      >
        <ValidationTable
          data={data ?? []}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
        />
      </AsyncState>

      {/* Example for adding more components below */}
      <Box mt={6}>
        {/* Future components like stats, filters, or batch actions */}
      </Box>
    </ResponsiveContainer>
  );
}

const ResponsiveContainer = styled(BaseWrapper)<{ colorMode: string }>`
  .datatable {
    @media (max-width: 768px) {
      overflow-x: auto;
    }
  }
`;

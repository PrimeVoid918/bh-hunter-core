import React from 'react';
import UserInformation from '@/pages/shared/components/user-information/UserInformation';
import DialogWrapper from '@/pages/shared/components/dialog-wrapper/DialogWrapper';
import { GetTenant } from '@/infrastructure/tenants/tenant.types';
import { Box, Button, Flex, useDisclosure } from '@chakra-ui/react';
import { useDeleteTenantMutation } from '@/infrastructure/admin/admin.redux.api';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import { RootState } from '@/app/store/stores';
import { useSelector } from 'react-redux';

export default function TableTenantRowActionsConfig({
  rowData,
}: {
  rowData: GetTenant;
}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const adminId = user?.id;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [
    deleteTenant,
    {
      isError: isDeleteError,
      isLoading: isDeleteLoading,
      error: errorDeleteObj,
      reset: resetTenantDeletion,
    },
  ] = useDeleteTenantMutation();

  // Confirm delete modal
  const {
    isOpen: isOpenConfirmDialog,
    onOpen: _onOpenConfirmDialog,
    onClose: onCloseConfirmDialog,
  } = useDisclosure();

  const onOpenConfirmDialog = () => {
    resetTenantDeletion?.(); // reset mutation state
    _onOpenConfirmDialog(); // then open the modal
  };

  const [successDialogIsOpen, setSuccessDialogIsOpen] = React.useState(false);

  const handleConfirmDelete = async () => {
    if (!adminId) {
      return console.error('Admin ID not found');
    }
    try {
      // Call RTK mutation and unwrap to throw on error
      await deleteTenant({ adminId, tenantId: rowData.id }).unwrap();

      // success flow
      onCloseConfirmDialog();
      onClose(); // optionally close details modal
      setSuccessDialogIsOpen(true);
    } catch (err) {
      console.error('Error deleting user:', err);
      // error will automatically be handled by AsyncState
    }
  };

  return (
    <>
      {/* Trigger details modal */}
      <Button onClick={onOpen}>Details</Button>

      {/* Details Modal */}
      {isOpen && (
        <DialogWrapper
          isOpen={isOpen}
          onClose={onClose}
          closeOnEsc={false}
          closeOnOverlayClick={false}
          showCloseButton
          header="User Information"
          chakraStyling={{
            w: { base: '90vw', md: '40rem' },
            maxH: { base: '80vh', md: '60vh' },
            overflowY: 'auto',
          }}
          footer={
            <Flex justify="space-between" w="100%">
              <Button colorScheme="yellow">Suspend</Button>
              <Button colorScheme="red" onClick={onOpenConfirmDialog}>
                Delete
              </Button>
            </Flex>
          }
        >
          <UserInformation id={rowData.id} />
        </DialogWrapper>
      )}

      <Button colorScheme="red" onClick={onOpenConfirmDialog}>
        Delete
      </Button>

      {/* AsyncState wraps confirm delete modal */}
      <AsyncState
        isLoading={isDeleteLoading}
        isError={isDeleteError}
        errorObject={errorDeleteObj}
        errorBody={(err) => {
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
                <Box>
                  ⚠️ Client error ({err.status}): maybe bad request or
                  unauthorized.
                  {/* <pre>{JSON.stringify(err.data, null, 2)}</pre> */}
                </Box>
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
        {isOpenConfirmDialog && (
          <DialogWrapper
            isOpen={isOpenConfirmDialog}
            onClose={onCloseConfirmDialog}
            closeOnOverlayClick={false}
            closeOnEsc={false}
            header="Deleting User"
            chakraStyling={{
              w: { base: '90vw', md: '40rem' },
              maxH: { base: '80vh', md: '60vh' },
              overflowY: 'auto',
            }}
            footer={
              <Flex justify="space-between" width="100%">
                <Button onClick={onCloseConfirmDialog}>Cancel</Button>
                <Button
                  colorScheme="red"
                  onClick={handleConfirmDelete}
                  isLoading={isDeleteLoading}
                >
                  Delete
                </Button>
              </Flex>
            }
          >
            <div style={{ padding: '1rem' }}>
              Are you sure you want to delete user {rowData.fullname}?
            </div>
          </DialogWrapper>
        )}
      </AsyncState>

      {/* Success Modal */}
      {successDialogIsOpen && (
        <DialogWrapper
          isOpen={successDialogIsOpen}
          onClose={() => setSuccessDialogIsOpen(false)}
          header="User Deletion"
          chakraStyling={{
            w: { base: '90vw', md: '40rem' },
            maxH: { base: '80vh', md: '80vh' },
          }}
          footer={
            <Button onClick={() => setSuccessDialogIsOpen(false)}>Close</Button>
          }
        >
          <div>User {rowData.fullname} has been deleted.</div>
        </DialogWrapper>
      )}
    </>
  );
}

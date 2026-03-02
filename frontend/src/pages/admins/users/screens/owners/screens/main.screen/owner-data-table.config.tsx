import React from 'react';
import { createFilterElement } from '@/pages/shared/components/data-table/services';
import { TableConfig } from '@/pages/shared/components/data-table/types';
import { Box, Button, Flex, useDisclosure } from '@chakra-ui/react';
import { RootState } from '@/app/store/stores';
import { useSelector } from 'react-redux';
import { GetOwner } from '@/infrastructure/owner/owner.types';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import DialogWrapper from '@/pages/shared/components/dialog-wrapper/DialogWrapper';
import OwnerInformationComponent from './owner-information.component';
import { useDeleteOwnerMutation } from '@/infrastructure/admin/admin.redux.api';

export const tableConfig: TableConfig<GetOwner>[] = [
  {
    columnName: 'ID',
    field: 'id',
    filterType: 'input',
  },
  {
    columnName: 'Name',
    field: 'fullname',
    filterType: 'input',
  },
  {
    columnName: 'Email',
    field: 'email',
    filterType: 'input',
  },
  {
    columnName: 'Verified',
    field: 'isVerified',
    filterType: 'dropdown',
    filterElement: createFilterElement(
      'dropdown',
      [false, true],
      'Select Toggle',
      {
        true: 'Verified',
        false: 'Not Verified',
      },
    ),
    actionComponent(rowData) {
      return <>{rowData.isVerified ? 'Verified' : 'Not Verified'}</>;
    },
  },
  {
    columnName: 'Actions',
    field: 'actions',
    filterType: 'input',
    filterElement: createFilterElement('none'),
    actionComponent: (rowData: GetOwner) => {
      // TODO: refactor this shiii dawg
      const RowActions = () => {
        const user = useSelector((state: RootState) => state.auth.user);
        const adminId = user?.id;
        const { isOpen, onOpen, onClose } = useDisclosure();
        const [
          deleteOwner,
          {
            isError: isDeleteError,
            isLoading: isDeleteLoading,
            error: errorDeleteObj,
            reset: resetOwnerDeletion,
          },
        ] = useDeleteOwnerMutation();

        // Confirm delete modal
        const {
          isOpen: isOpenConfirmDialog,
          onOpen: _onOpenConfirmDialog,
          onClose: onCloseConfirmDialog,
        } = useDisclosure();

        const onOpenConfirmDialog = () => {
          resetOwnerDeletion?.(); // reset mutation state
          _onOpenConfirmDialog(); // then open the modal
        };

        const [successDialogIsOpen, setSuccessDialogIsOpen] =
          React.useState(false);

        const handleConfirmDelete = async () => {
          if (!adminId) {
            return console.error('Admin ID not found');
          }
          try {
            // Call RTK mutation and unwrap to throw on error
            await deleteOwner({ adminId, ownerId: rowData.id }).unwrap();

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
                <OwnerInformationComponent id={rowData.id} />
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
                  <Button onClick={() => setSuccessDialogIsOpen(false)}>
                    Close
                  </Button>
                }
              >
                <div>User {rowData.fullname} has been deleted.</div>
              </DialogWrapper>
            )}
          </>
        );
      };

      return <RowActions />;
    },
  },
];

import React from 'react';
import DialogWrapper from '@/features/shared/components/dialog-wrapper/DialogWrapper';
import { Box, Button, Flex, useDisclosure } from '@chakra-ui/react';
import AsyncState from '@/features/shared/components/async-state/AsyncState';
import { RootState } from '@/app/store/stores';
import { useSelector } from 'react-redux';
import { PermitMetaData } from '@/infrastructure/permits/permits.types';
import ModalWrapper from '@/features/shared/components/modal-wrapper/ModalWrapper';
// import PermitInfo from './permit-info/PermitInfo';
import { usePatchVerificationDocumentMutation } from '@/infrastructure/valid-docs/valid-docs.redux.api';

export default function TableOwnerRowActionsConfig({
  rowData,
}: {
  rowData: PermitMetaData;
}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const adminId = user?.id;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [
    patchDocument,
    {
      isError: isPatchDocumentError,
      isLoading: isPatchDocumentLoading,
      error: errorPatchDocumentObj,
      reset: resetPatchDocument,
    },
  ] = usePatchVerificationDocumentMutation();

  // Confirm delete modal
  const {
    isOpen: isOpenConfirmDialog,
    onOpen: _onOpenConfirmDialog,
    onClose: onCloseConfirmDialog,
  } = useDisclosure();

  const onOpenConfirmDialog = () => {
    resetPatchDocument?.(); // reset mutation state
    _onOpenConfirmDialog(); // then open the modal
  };

  const [successDialogIsOpen, setSuccessDialogIsOpen] = React.useState(false);

  const handleConfirmApprove = async () => {
    if (!adminId) {
      return console.error('Admin ID not found');
    }
    try {
      // Call RTK mutation and unwrap to throw on error
      // await deleteTenant({ adminId, tenantId: rowData.id }).unwrap();
      await patchDocument({
        permitId: rowData.id,
        data: {
          adminId: adminId,
          newVerificationStatus: 'APPROVED',
        },
      }).unwrap();

      // success flow
      onCloseConfirmDialog();
      onClose(); // optionally close details modal
      setSuccessDialogIsOpen(true);
    } catch (err) {
      console.error('Error updating document:', err);
      // error will automatically be handled by AsyncState
    }
  };

  return (
    <>
      {/* Trigger details modal */}
      <Button onClick={onOpen}>Open Details</Button>
      {isOpen && (
        <ModalWrapper
          isOpen={isOpen}
          onClose={onClose}
          closeOnEsc={false}
          closeOnOverlayClick={false}
          showCloseButton
          chakraStyling={{
            w: { base: '90dvw', md: '90dvw' },
            h: { base: '90dvh', md: '85dvh' },
            maxH: { base: '95dvh', md: '90dvh' },
            borderColor: 'yellow',
            borderWidth: '3px',
          }}
        >
          <PermitInfo permitId={rowData.id} />
        </ModalWrapper>
      )}

      {/* <Button colorScheme="green" onClick={onOpenConfirmDialog}>
        Approve
      </Button> */}

      {/* AsyncState wraps confirm delete modal */}
      <AsyncState
        isLoading={isPatchDocumentLoading}
        isError={isPatchDocumentError}
        errorObject={errorPatchDocumentObj}
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
                  <pre>{JSON.stringify(err.data.message, null, 2)}</pre>
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
            header="Approve Verification Document"
            chakraStyling={{
              w: { base: '90vw', md: '40rem' },
              maxH: { base: '80vh', md: '60vh' },
              overflowY: 'auto',
            }}
            footer={
              <Flex justify="space-between" width="100%">
                <Button onClick={onCloseConfirmDialog}>Cancel</Button>
                <Button
                  colorScheme="green"
                  onClick={handleConfirmApprove}
                  isLoading={isPatchDocumentLoading}
                >
                  Approve
                </Button>
              </Flex>
            }
          >
            <div style={{ padding: '1rem' }}>
              Are you sure you want to Approve Document{' '}
              {rowData.verificationType} of user {rowData.ownerFullName}?
            </div>
          </DialogWrapper>
        )}
      </AsyncState>

      {/* Success Modal */}
      {successDialogIsOpen && (
        <DialogWrapper
          isOpen={successDialogIsOpen}
          onClose={() => setSuccessDialogIsOpen(false)}
          header="User Verification Status"
          chakraStyling={{
            w: { base: '90vw', md: '40rem' },
            maxH: { base: '80vh', md: '80vh' },
          }}
          footer={
            <Button onClick={() => setSuccessDialogIsOpen(false)}>Close</Button>
          }
        >
          <div>
            Permit {rowData.verificationType} of User {rowData.ownerFullName}{' '}
            has been Approved.
          </div>
        </DialogWrapper>
      )}
    </>
  );
}

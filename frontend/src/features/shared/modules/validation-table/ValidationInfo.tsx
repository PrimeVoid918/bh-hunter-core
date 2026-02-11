import React from 'react';
import { Flex, Box, Text, Button, useDisclosure } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { PdfViewer } from '@/infrastructure/utils/pdf/PDFViewer.component';
// import {
//   useGetOneQuery,
//   usePatchVerificationDocumentMutation,
// } from '@/infrastructure/valid-docs/valid-docs.redux.api';
import AsyncState from '@/features/shared/components/async-state/AsyncState';
import { parseIsoDate } from '@/infrastructure/utils/parseISODate.util';
import DialogWrapper from '@/features/shared/components/dialog-wrapper/DialogWrapper';

export default function ValidationInfo({ permitId }: { permitId: number }) {
  // const {
  //   data: permitData,
  //   isLoading,
  //   isError,
  //   error,
  // } = useGetOneQuery({
  //   entityType: 'owners',
  //   id: permitId,
  // });
  const permitData: any = {};
  const permitDateObject = parseIsoDate(permitData?.createdAt);

  // Patch mutation
  // const [
  //   patchDocument,
  //   {
  //     isLoading: isPatchLoading,
  //     isError: isPatchError,
  //     error: patchErrorObj,
  //     reset,
  //   },
  // ] = usePatchVerificationDocumentMutation();

  // Modal controls
  const { isOpen, onOpen, onClose } = useDisclosure(); // Confirm modal
  const [resultModalOpen, setResultModalOpen] = React.useState(false);
  const [resultMessage, setResultMessage] = React.useState<string | null>(null);
  const [resultIsError, setResultIsError] = React.useState(false);
  const [actionType, setActionType] = React.useState<'APPROVED' | 'REJECTED'>(
    'APPROVED',
  );

  const handleConfirmAction = async () => {
    if (!permitData) return;

    try {
      // await patchDocument({
      //   permitId: permitData.id,
      //   data: {
      //     adminId: 1, // or from redux state
      //     newVerificationStatus: actionType,
      //   },
      // }).unwrap();

      setResultMessage(
        `Document "${permitData.verificationType}" for ${permitData.ownerFullName} has been ${
          actionType === 'APPROVED' ? 'approved' : 'rejected'
        }.`,
      );
      setResultIsError(false);
      onClose();
      setResultModalOpen(true);
    } catch (err: any) {
      // Narrow error to server response
      const serverMessage =
        err?.data?.message || 'Something went wrong. Please try again.';
      setResultMessage(serverMessage);
      setResultIsError(true);
      setResultModalOpen(true);
    }
  };

  const openModalWithAction = (approve: boolean) => {
    setActionType(approve ? 'APPROVED' : 'REJECTED');
    // reset?.();
    onOpen();
  };

  return (
    <>
      <AsyncState
        //! isLoading={isLoading}
        isLoading={false}
        globalOverlay={false}
        //! isError={isError}
        isError={false}
        //! errorObject={error}
        errorObject={{} as any}
        errorBody={(err) => {
          if ('status' in err) {
            if (err.status >= '500') return <Box>🚨 Server error (500)</Box>;
            if (err.status >= '400')
              return (
                <Box>
                  ⚠️ Client error ({err.status})
                  <pre>{JSON.stringify(err.data?.message, null, 2)}</pre>
                </Box>
              );
          }
          return (
            <Box color="gray.500">
              ❓ Unexpected error<pre>{JSON.stringify(err, null, 2)}</pre>
            </Box>
          );
        }}
      >
        {permitData && (
          <BodyContainer>
            <Box
              flex="2"
              bg="gray.50"
              overflowY="scroll"
              className="pdf-viewer-container"
            >
              <PdfViewer url={permitData.url} />
            </Box>

            <Box
              flex="1"
              borderLeft="1px solid"
              borderColor="gray.200"
              minHeight={0}
            >
              <Flex direction="column" height="100%">
                {/* Top details */}
                <Box flex="1" p={4} overflowY="auto" minHeight={0}>
                  <Text fontWeight="bold">Permit Info</Text>
                  <Text>ID: {permitData?.id}</Text>
                  <Text>Owner: {permitData.ownerFullName}</Text>
                  <Text>Status: {permitData.status}</Text>
                  <Text>
                    Created At: {permitDateObject?.dateOnly.toString()}
                  </Text>
                </Box>

                {/* Bottom actions */}
                <Box
                  p={4}
                  borderTop="1px solid"
                  borderColor="gray.200"
                  display="flex"
                  gap={2}
                  justifyContent="flex-end"
                  flexShrink={0}
                >
                  <Button
                    colorScheme="green"
                    onClick={() => openModalWithAction(true)}
                  >
                    Approve
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={() => openModalWithAction(false)}
                  >
                    Reject
                  </Button>
                </Box>
              </Flex>
            </Box>
          </BodyContainer>
        )}
      </AsyncState>

      {/* Confirm Modal */}
      {permitData && (
        <DialogWrapper
          isOpen={isOpen}
          onClose={onClose}
          header={`${actionType === 'APPROVED' ? 'Approve' : 'Reject'} Document`}
          chakraStyling={{
            w: { base: '90vw', md: '40rem' },
            maxH: { base: '80vh', md: '60vh' },
            overflowY: 'auto',
          }}
          footer={
            <Flex justify="space-between" w="100%">
              <Button onClick={onClose}>Cancel</Button>
              <Button
                colorScheme={actionType === 'APPROVED' ? 'green' : 'red'}
                onClick={handleConfirmAction}
                isLoading={false}
                //! isLoading={isPatchLoading}
              >
                {actionType === 'APPROVED' ? 'Approve' : 'Reject'}
              </Button>
            </Flex>
          }
        >
          <Box p={4}>
            Are you sure you want to{' '}
            {actionType === 'APPROVED' ? 'approve' : 'reject'} document "
            {permitData.verificationType}" for {permitData.ownerFullName}?
          </Box>
        </DialogWrapper>
      )}

      {/* Success Modal */}
      {resultModalOpen && permitData && (
        <DialogWrapper
          isOpen={resultModalOpen}
          onClose={() => setResultModalOpen(false)}
          header={resultIsError ? 'Action Failed' : 'Action Successful'}
          chakraStyling={{
            w: { base: '90vw', md: '40rem' },
            maxH: { base: '80vh', md: '80vh' },
          }}
          footer={
            <Button onClick={() => setResultModalOpen(false)}>Close</Button>
          }
        >
          <Box color={resultIsError ? 'red.500' : 'green.500'} p={2}>
            {resultMessage}
          </Box>
        </DialogWrapper>
      )}
    </>
  );
}

const BodyContainer = styled(Flex)`
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  min-height: 0;

  > :nth-of-type(1) {
    flex: 2;
    min-height: 0;
  }
  > :nth-of-type(2) {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .pdf-viewer-container {
    padding: 1rem;
    background-color: transparent !important;
    &::-webkit-scrollbar {
      display: none !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
  }
`;

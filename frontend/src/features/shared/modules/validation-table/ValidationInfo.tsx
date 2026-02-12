import React from 'react';
import { Flex, Box, Text, Button } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { PdfViewer } from '@/infrastructure/utils/pdf/PDFViewer.component';
import { ImageViewer } from '@/infrastructure/utils/media/ImageViewer.component';
import { parseIsoDate } from '@/infrastructure/utils/parseISODate.util';
import AsyncState from '@/features/shared/components/async-state/AsyncState';
import {
  VerificationDocumentMetaData,
  UserRoleType,
} from '@/infrastructure/documents/documents.type';
import { useGetOneQuery } from '@/infrastructure/valid-docs/valid-docs.redux.api';
import DialogWrapper from '../../components/dialog-wrapper/DialogWrapper';

interface ValidationInfoInterface {
  thisTableIsFor: string;
  permitId: number;
  onApprove: (row: VerificationDocumentMetaData) => void;
  onReject: (row: VerificationDocumentMetaData, rejectReason: string) => void;
  onDelete: (row: VerificationDocumentMetaData) => void;
}

export default function ValidationInfo({
  permitId,
  thisTableIsFor,
  onApprove,
  onReject,
  onDelete,
}: ValidationInfoInterface) {
  const {
    data: permitData,
    isLoading,
    isError,
    error,
  } = useGetOneQuery({
    userType: thisTableIsFor as UserRoleType,
    documentId: permitId,
  });

  const permitDateObject = parseIsoDate(permitData?.createdAt);

  const [actionModalOpen, setActionModalOpen] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState<
    'APPROVE' | 'REJECT' | 'DELETE' | null
  >(null);
  const [rejectReason, setRejectReason] = React.useState<string>('');

  return (
    <AsyncState
      isLoading={isLoading}
      isError={isError}
      errorObject={error}
      errorBody={(err) => (
        <Box color="gray.500">
          ❓ Unexpected error
          <pre>{JSON.stringify(err, null, 2)}</pre>
        </Box>
      )}
    >
      {permitData && (
        <BodyContainer>
          {/* Viewer */}
          <Box
            flex="2"
            bg="gray.50"
            overflowY="scroll"
            className="pdf-viewer-container"
          >
            {permitData.fileFormat === 'PDF' ? (
              <PdfViewer url={permitData.url} />
            ) : (
              <ImageViewer url={permitData.url} />
            )}
          </Box>

          {/* Info Panel */}
          <Box
            flex="1"
            borderLeft="1px solid"
            borderColor="gray.200"
            minHeight={0}
          >
            <Flex direction="column" height="100%">
              <Box flex="1" p={4} overflowY="auto" minHeight={0}>
                <Text fontWeight="bold">Permit Info</Text>
                <Text>ID: {permitData.id}</Text>
                <Text>
                  Owner: {permitData.user.firstname} {permitData.user.lastname}
                </Text>
                <Text>Status: {permitData.verificationStatus}</Text>
                <Text>Created At: {permitDateObject?.dateOnly.toString()}</Text>
              </Box>

              <Box
                p={4}
                borderTop="1px solid"
                borderColor="gray.200"
                display="flex"
                gap={2}
                justifyContent="flex-end"
                flexShrink={0}
              >
                {permitData.verificationStatus == 'PENDING' ? (
                  <>
                    {' '}
                    <Button
                      colorScheme="green"
                      onClick={() => {
                        setSelectedAction('APPROVE');
                        setActionModalOpen(true);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      colorScheme="red"
                      onClick={() => {
                        setSelectedAction('REJECT');
                        setActionModalOpen(true);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button
                    colorScheme="green"
                    onClick={() => {
                      setSelectedAction('DELETE');
                      setActionModalOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Flex>
          </Box>
          <DialogWrapper
            isOpen={actionModalOpen}
            onClose={() => setActionModalOpen(false)}
            header={
              selectedAction === 'DELETE'
                ? 'Confirm Deletion'
                : selectedAction === 'APPROVE'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'
            }
            footer={
              <Flex justify="flex-end" gap={2} w="100%">
                <Button onClick={() => setActionModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  colorScheme={selectedAction === 'APPROVE' ? 'green' : 'red'}
                  onClick={() => {
                    if (!permitData) return;

                    if (selectedAction === 'APPROVE') {
                      onApprove(permitData);
                    } else if (selectedAction === 'REJECT') {
                      onReject({ ...permitData }, rejectReason);
                    } else if (selectedAction === 'DELETE') {
                      onDelete({ ...permitData });
                    }

                    setActionModalOpen(false);
                    setRejectReason('');
                    setSelectedAction(null);
                  }}
                >
                  {selectedAction === 'DELETE'
                    ? 'Deletion'
                    : selectedAction === 'APPROVE'
                      ? 'Approval'
                      : 'Rejection'}
                </Button>
              </Flex>
            }
          >
            <Box p={4}>
              Are you sure you want to{' '}
              {selectedAction === 'DELETE'
                ? 'deletion'
                : selectedAction === 'APPROVE'
                  ? 'approval'
                  : 'rejection'}{' '}
              {permitData?.verificationType} for {permitData?.user.firstname}{' '}
              {permitData?.user.lastname}?
              {selectedAction === 'REJECT' && (
                <Box mt={4}>
                  <Text mb={1}>Reject Reason (optional)</Text>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      borderRadius: '0.25rem',
                      padding: '0.5rem',
                      borderColor: '#ccc',
                    }}
                  />
                </Box>
              )}
            </Box>
          </DialogWrapper>
        </BodyContainer>
      )}
    </AsyncState>
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

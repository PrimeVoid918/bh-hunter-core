import React from 'react';
import BaseWrapper from '@/pages/shared/layouts/wrappers/base-wrapper';
import styled from '@emotion/styled';

import DataTable from '../../../../../../shared/components/data-table/DataTable';
import { Box, Button, useDisclosure } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';
import { useGetAllOwnersQuery } from '@/infrastructure/admin/admin.redux.api';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import DialogWrapper from '@/pages/shared/components/dialog-wrapper/DialogWrapper';
import { tableConfig } from './owner-data-table.config';
import CreateOwnerComponentForm from './create-owner.component.form';
import { Colors } from '@/pages/constants';
import { GetOwner } from '@/infrastructure/owner/owner.types';

export default function OwnersMainScreen() {
  const { colorMode } = useColorMode();
  const [page, setPage] = React.useState<number | undefined>(1);
  const { data, isError, isLoading, error } = useGetAllOwnersQuery({
    page,
  });

  const [successDialogIsOpen, setSuccessDialogIsOpen] = React.useState(false);

  const {
    isOpen: addOwnerModalIsOpen,
    onOpen: addOwnerModalOnOpen,
    onClose: addOwnerModalOnClose,
  } = useDisclosure();

  const handleOwnerCreated = () => {
    addOwnerModalOnClose(); // close main form
    setSuccessDialogIsOpen(true); // open success dialog
  };

  return (
    <PageContainer colorMode={colorMode}>
      <AsyncState
        isLoading={isLoading}
        isError={isError}
        errorObject={error}
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
        <DataTable<GetOwner>
          data={data ?? []}
          tableConfig={tableConfig}
          emptyTableMessage="No Owners Found"
          enableGlobalSearch={true}
          setPageIndex={setPage}
          headerButtonSlot={
            <AddUserButton colorMode={colorMode} onClick={addOwnerModalOnOpen}>
              Add Owner
            </AddUserButton>
          }
        />
        {addOwnerModalIsOpen && (
          <CreateOwnerComponentForm
            dialogConfig={{
              isOpen: addOwnerModalIsOpen,
              onClose: addOwnerModalOnClose,
              closeOnOverlayClick: false,
              closeOnEsc: false,
              showCloseButton: true,
              header: 'Add User',
              chakraStyling: {
                w: { base: '90vw', md: '40rem' },
                maxH: { base: '80vh', md: '80vh' },
              },
            }}
            onSuccess={handleOwnerCreated}
          />
        )}
      </AsyncState>
      {successDialogIsOpen && (
        <DialogWrapper
          isOpen={successDialogIsOpen}
          onClose={() => setSuccessDialogIsOpen(false)}
          header="User Created!"
          footer={
            <Button onClick={() => setSuccessDialogIsOpen(false)}>Close</Button>
          }
          chakraStyling={{
            w: { base: 'auto', md: 'auto' },
            maxH: { base: 'auto', md: 'auto' },
          }}
        >
          <div style={{ padding: '1rem' }}>User created successfully!</div>
        </DialogWrapper>
      )}
    </PageContainer>
  );
}

const PageContainer = styled(BaseWrapper)<{ colorMode: string }>`
  > :not(:nth-of-type(1)) {
    border: 1px solid yellow;
    aspect-ratio: 1/1;
    height: 10;
  }
  .datatable {
    /* Scrollable on small screens */
    @media (max-width: 768px) {
      overflow-x: auto;
    }
  }
`;

const AddUserButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'colorMode',
})<{ colorMode: string }>`
  background-color: ${({ colorMode }) =>
    colorMode === 'dark' ? Colors.PrimaryLight[5] : Colors.PrimaryLight[4]};
`;

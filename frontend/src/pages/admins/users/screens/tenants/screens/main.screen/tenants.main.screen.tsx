import React from 'react';

import BaseWrapper from '@/pages/shared/layouts/wrappers/base-wrapper';
import { Box, Button, useColorMode, useDisclosure } from '@chakra-ui/react';
import { GetTenant } from '@/infrastructure/tenants/tenant.types';
import DataTable from '@/pages/shared/components/data-table/DataTable';
import { Colors } from '@/pages/constants';
import styled from '@emotion/styled';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import { tableConfig } from './table.config';
import CreateUserForm from './create-user-form';
import DialogWrapper from '@/pages/shared/components/dialog-wrapper/DialogWrapper';
import { useGetAllTenantsQuery } from '@/infrastructure/admin/admin.redux.api';

export default function TenantsMainScreen() {
  const { colorMode } = useColorMode();

  const [page, setPage] = React.useState<number | undefined>(1);
  const { data, isError, isLoading, error } = useGetAllTenantsQuery({
    page,
  });

  const [successDialogIsOpen, setSuccessDialogIsOpen] = React.useState(false);

  const {
    isOpen: addTenantModalIsOpen,
    onOpen: addTenantModalOnOpen,
    onClose: addTenantModalOnClose,
  } = useDisclosure();

  const handleTenantCreated = () => {
    addTenantModalOnClose(); // close main form
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
        <DataTable<GetTenant>
          data={data ?? []}
          tableConfig={tableConfig}
          emptyTableMessage="No Tenants Found"
          enableGlobalSearch={true}
          setPageIndex={setPage}
          headerButtonSlot={
            <AddUserButton colorMode={colorMode} onClick={addTenantModalOnOpen}>
              Add Tenant
            </AddUserButton>
          }
        />
        {addTenantModalIsOpen && (
          <CreateUserForm
            dialogConfig={{
              isOpen: addTenantModalIsOpen,
              onClose: addTenantModalOnClose,
              closeOnOverlayClick: false,
              closeOnEsc: false,
              showCloseButton: true,
              header: 'Add User',
              chakraStyling: {
                w: { base: '90vw', md: '40rem' },
                maxH: { base: '80vh', md: '80vh' },
              },
            }}
            onSuccess={handleTenantCreated}
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

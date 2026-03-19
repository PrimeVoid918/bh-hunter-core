import React, { useMemo } from 'react';
import DataTable from '../../components/data-table/DataTable';
import { Box } from '@mui/material';
import { createUsersTableConfig } from './UsersTable.config';
import { FindOneOwner } from '@/infrastructure/owner/owner.types';
import { FindOneTenant } from '@/infrastructure/tenants/tenant.types';

export type UserTableRow = FindOneOwner | FindOneTenant;

export type UsersTableProps = {
  data: UserTableRow[];
  thisTableIsFor: 'OWNER' | 'TENANT';
  onSuspend: (row: UserTableRow) => void;
  onDelete: (row: UserTableRow) => void;
};
export default function UsersTable({
  data,
  thisTableIsFor,
  onSuspend,
  onDelete,
}: UsersTableProps) {
  // Memoize config so columns don't re-render unnecessarily
  const tableConfig = useMemo(
    () =>
      createUsersTableConfig({
        thisTableIsFor,
        onSuspend,
        onDelete,
      }),
    [thisTableIsFor, onSuspend, onDelete],
  );

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <DataTable<UserTableRow>
        data={data ?? []}
        tableConfig={tableConfig}
        emptyTableMessage={`No ${thisTableIsFor} validation records found.`}
        enableGlobalSearch
      />
    </Box>
  );
}

// UsersTableConfig.tsx
import React from 'react';
import { Chip, Typography } from '@mui/material';
import { parseIsoDate } from '@/infrastructure/utils/parseISODate.util';
import UsersTableRowActionsConfig from './UsersTableRowActionsConfig';
import { UserTableRow } from './UsersTable';

// TableConfig type imported from your DataTable types
import { TableConfig } from '../../components/data-table/types';

interface UsersTableConfigProps {
  thisTableIsFor: 'OWNER' | 'TENANT';
  onSuspend: (row: UserTableRow) => void;
  onDelete: (row: UserTableRow) => void;
}

// Factory function to create table config
export const createUsersTableConfig = ({
  thisTableIsFor,
  onSuspend,
  onDelete,
}: UsersTableConfigProps): TableConfig<UserTableRow>[] => [
  {
    columnName: 'Full Name',
    field: 'fullname',
    filterType: 'input',
  },
  {
    columnName: 'Email',
    field: 'email',
    filterType: 'input',
  },
  {
    columnName: 'Role',
    field: 'role',
    filterType: 'dropdown',
    dropdownOptions: ['OWNER', 'TENANT'],
    body: (row) => (
      <Chip
        label={row.role}
        size="small"
        color={row.role === 'OWNER' ? 'primary' : 'default'}
        variant="outlined"
        sx={{ fontWeight: 700, fontSize: '0.65rem', borderRadius: '6px' }}
      />
    ),
  },
  {
    columnName: 'Status',
    field: 'verificationLevel',
    filterType: 'dropdown',
    dropdownOptions: ['UNVERIFIED', 'PROFILE_ONLY', 'FULLY_VERIFIED'],
    body: (row) => {
      const colorMap: Record<
        string,
        'success' | 'warning' | 'error' | 'default'
      > = {
        UNVERIFIED: 'error',
        PROFILE_ONLY: 'warning',
        FULLY_VERIFIED: 'success',
      };
      return (
        <Chip
          label={row.verificationLevel}
          size="small"
          color={colorMap[row.verificationLevel || ''] || 'default'}
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: '0.65rem', borderRadius: '6px' }}
        />
      );
    },
  },
  {
    columnName: 'Registration',
    field: 'registrationStatus',
    filterType: 'dropdown',
    dropdownOptions: ['PENDING', 'COMPLETED'],
    body: (row) => (
      <Chip
        label={row.registrationStatus}
        size="small"
        color={row.registrationStatus === 'COMPLETED' ? 'success' : 'warning'}
        variant="outlined"
        sx={{ fontWeight: 700, fontSize: '0.65rem', borderRadius: '6px' }}
      />
    ),
  },
  {
    columnName: 'Created At',
    field: 'createdAt',
    filterType: 'input',
    body: (row) => {
      const parsed = parseIsoDate(row.createdAt);
      return (
        <Typography
          variant="body2"
          sx={{ fontSize: '0.85rem', color: 'text.secondary' }}
        >
          {parsed?.dateOnly ?? 'Invalid Date'}
        </Typography>
      );
    },
  },
  {
    columnName: 'Actions',
    field: 'actions',
    filterType: undefined,
    actionComponent: (row: UserTableRow) => (
      <UsersTableRowActionsConfig
        rowData={row}
        thisTableIsFor={thisTableIsFor}
        onSuspend={onSuspend}
        onDelete={onDelete}
      />
    ),
  },
];

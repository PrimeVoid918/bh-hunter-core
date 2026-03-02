import React from 'react';
import { createFilterElement } from '@/pages/shared/components/data-table/services';
import { TableConfig } from '@/pages/shared/components/data-table/types';
import { GetTenant } from '@/infrastructure/tenants/tenant.types';
import TableTenantRowActionsConfig from './table.tenant-rowActions.config';

export const tableConfig: TableConfig<GetTenant>[] = [
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
    actionComponent: (rowData: GetTenant) => {
      return <TableTenantRowActionsConfig rowData={rowData} />;
    },
  },
];

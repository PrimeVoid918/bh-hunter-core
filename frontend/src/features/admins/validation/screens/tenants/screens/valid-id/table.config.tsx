import { TableConfig } from '../../../../../../shared/components/data-table/types';
import {
  VerificationDocumentMetaData,
  VerificationStatus,
  VerificationType,
} from '@/infrastructure/documents/documents.type';
import { createFilterElement } from '@/features/shared/components/data-table/services';
import TableOwnerRowActionsConfig from './table.tenant-rowActions.config';

export const tableConfig: TableConfig<VerificationDocumentMetaData>[] = [
  {
    columnName: 'Owner',
    field: 'ownerFullName',
    filterType: 'input',
  },
  {
    columnName: 'Permit Type',
    field: 'verificationType',
    filterType: 'dropdown',
    filterElement: createFilterElement<VerificationType>(
      'dropdown',
      ['DTI', 'SEC', 'FIRE_CERTIFICATE'],
      'Search by type',
    ),
  },
  {
    columnName: 'Status',
    field: 'verificationStatus',
    filterType: 'dropdown',
    filterElement: createFilterElement<VerificationStatus>(
      'dropdown',
      ['APPROVED', 'PENDING', 'REJECTED', 'EXPIRED'],
      'Search by status',
    ),
  },
  {
    columnName: 'Date Created',
    field: 'createdAt',
    filterType: 'date',
  },
  {
    columnName: 'Actions',
    field: 'actions',
    filterType: undefined,
    actionComponent: (rowData: VerificationDocumentMetaData) => {
      return <TableOwnerRowActionsConfig rowData={rowData} />;
    },
  },
];

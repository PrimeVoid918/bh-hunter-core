import {
  VerificationDocumentMetaData,
  VerificationStatus,
  VerificationType,
} from '@/infrastructure/documents/documents.type';
import { TableConfig } from '../../components/data-table/types';
import { createFilterElement } from '@/features/shared/components/data-table/services';
import ValidationTableRowActionsConfig from './ValidationTableRowActionsConfig';

export const createValidationTableConfig = (actions: {
  thisTableIsFor: string;
  onApprove: (row: VerificationDocumentMetaData) => void;
  onReject: (row: VerificationDocumentMetaData, rejectReason: string) => void;
  onDelete: (row: VerificationDocumentMetaData) => void;
}): TableConfig<VerificationDocumentMetaData>[] => [
  // {
  //   columnName: 'Firstname',
  //   field: 'user.firstname',
  //   filterType: 'input',
  // },
  // {
  //   columnName: 'Lastname',
  //   field: 'user.lastname',
  //   filterType: 'input',
  // },
  {
    columnName: 'Full Name',
    field: 'fullName', // Virtual field
    filterType: 'input',
    // Search will look through this combined string:
    resolveValue: (row) => `${row.user.firstname} ${row.user.lastname}`,
  },
  {
    columnName: 'Email',
    field: 'user.email', // Automatic dot-notation resolution
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
      return <ValidationTableRowActionsConfig rowData={rowData} {...actions} />;
    },
  },
];

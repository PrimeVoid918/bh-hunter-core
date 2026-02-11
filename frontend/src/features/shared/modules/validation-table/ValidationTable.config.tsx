import {
  VerificationDocumentMetaData,
  VerificationStatus,
  VerificationType,
} from '@/infrastructure/documents/documents.type';
import { TableConfig } from '../../components/data-table/types';
import { createFilterElement } from '@/features/shared/components/data-table/services';
import ValidationTableRowActionsConfig from './ValidationTableRowActionsConfig';

export const createValidationTableConfig = (actions: {
  onApprove: (row: VerificationDocumentMetaData) => void;
  onReject: (row: VerificationDocumentMetaData) => void;
  onDelete: (row: VerificationDocumentMetaData) => void;
}): TableConfig<VerificationDocumentMetaData>[] => [
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
      return <ValidationTableRowActionsConfig rowData={rowData} {...actions} />;
    },
  },
];

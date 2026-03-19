import {
  VerificationDocumentMetaData,
  VerificationStatus,
  VerificationType,
} from '@/infrastructure/documents/documents.type';
import { TableConfig } from '../../components/data-table/types';
import { createFilterElement } from '@/pages/shared/components/data-table/services';
import { parseIsoDate } from '@/infrastructure/utils/parseISODate.util'; // Updated path
import ValidationTableRowActionsConfig from './ValidationTableRowActionsConfig';
import { Chip, Typography } from '@mui/material';

export const createValidationTableConfig = (actions: {
  thisTableIsFor: string;
  onApprove: (row: VerificationDocumentMetaData) => void;
  onReject: (row: VerificationDocumentMetaData, rejectReason: string) => void;
  onDelete: (row: VerificationDocumentMetaData) => void;
}): TableConfig<VerificationDocumentMetaData>[] => [
  {
    columnName: 'Full Name',
    field: 'fullName',
    filterType: 'input',
    resolveValue: (row) => `${row.user.firstname} ${row.user.lastname}`,
  },
  {
    columnName: 'Email',
    field: 'user.email',
    filterType: 'input',
  },
  {
    columnName: 'Type',
    field: 'verificationType',
    filterType: 'dropdown',
    filterElement: createFilterElement<VerificationType>(
      'dropdown',
      ['DTI', 'SEC', 'FIRE_CERTIFICATE'],
      'Type',
    ),
  },
  {
    columnName: 'Status',
    field: 'verificationStatus',
    filterType: 'dropdown',
    filterElement: createFilterElement<VerificationStatus>(
      'dropdown',
      ['APPROVED', 'PENDING', 'REJECTED', 'EXPIRED'],
      'Status',
    ),
    body: (row: VerificationDocumentMetaData) => {
      const status = row.verificationStatus;
      const colorMap: Record<
        string,
        'success' | 'warning' | 'error' | 'default'
      > = {
        APPROVED: 'success',
        PENDING: 'warning',
        REJECTED: 'error',
        EXPIRED: 'default',
      };

      return (
        <Chip
          label={status}
          size="small"
          color={colorMap[status] || 'default'}
          variant="outlined"
          sx={{
            fontWeight: 700,
            fontSize: '0.65rem',
            borderRadius: '6px',
            // Ensure contrast in both light/dark mode
            borderWidth: '1.5px',
          }}
        />
      );
    },
  },
  {
    columnName: 'Submitted',
    field: 'createdAt',
    filterType: 'input',
    body: (row: VerificationDocumentMetaData) => {
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
    actionComponent: (rowData: VerificationDocumentMetaData) => {
      return <ValidationTableRowActionsConfig rowData={rowData} {...actions} />;
    },
  },
];

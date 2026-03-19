import React, { useMemo } from 'react';
import DataTable from '../../components/data-table/DataTable';
import { VerificationDocumentMetaData } from '@/infrastructure/documents/documents.type';
import { createValidationTableConfig } from './ValidationTable.config';
import { Box } from '@mui/material';
import { Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ValidationTableInterface {
  data: VerificationDocumentMetaData[];
  thisTableIsFor: string;
  onApprove: (row: VerificationDocumentMetaData) => void;
  onReject: (row: VerificationDocumentMetaData, rejectReason: string) => void;
  onDelete: (row: VerificationDocumentMetaData) => void;
  onRefreshData?: () => void;
}

export default function ValidationTable({
  data,
  thisTableIsFor,
  onApprove,
  onDelete,
  onReject,
  onRefreshData,
}: ValidationTableInterface) {
  // Memoize config so we don't re-render table columns unless actions change
  const tableConfig = useMemo(
    () =>
      createValidationTableConfig({
        thisTableIsFor,
        onApprove,
        onDelete,
        onReject,
      }),
    [thisTableIsFor, onApprove, onDelete, onReject],
  );

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <DataTable<VerificationDocumentMetaData>
        data={data ?? []}
        tableConfig={tableConfig}
        emptyTableMessage={`No ${thisTableIsFor} validation records found.`}
        enableGlobalSearch
        headerButtonSlot={
          onRefreshData ? (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefreshData}
            >
              Refresh
            </Button>
          ) : null
        }
      />
    </Box>
  );
}

import React from 'react';
import DataTable from '../../components/data-table/DataTable';
import { VerificationDocumentMetaData } from '@/infrastructure/documents/documents.type';
import { createValidationTableConfig } from './ValidationTable.config';

interface ValidationTableInterface {
  data: VerificationDocumentMetaData[];
  onApprove: (row: VerificationDocumentMetaData) => void;
  onReject: (row: VerificationDocumentMetaData) => void;
  onDelete: (row: VerificationDocumentMetaData) => void;
}

export default function ValidationTable({
  data,
  onApprove,
  onDelete,
  onReject,
}: ValidationTableInterface) {
  const tableConfig = React.useMemo(
    () =>
      createValidationTableConfig({
        onApprove,
        onDelete,
        onReject,
      }),
    [onApprove, onDelete, onReject],
  );

  return (
    <DataTable<VerificationDocumentMetaData>
      data={data ?? []}
      tableConfig={tableConfig}
      emptyTableMessage="No validations found."
      enableGlobalSearch
    />
  );
}

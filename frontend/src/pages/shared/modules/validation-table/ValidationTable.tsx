import React from 'react';
import DataTable from '../../components/data-table/DataTable';
import { VerificationDocumentMetaData } from '@/infrastructure/documents/documents.type';
import { createValidationTableConfig } from './ValidationTable.config';

interface ValidationTableInterface {
  data: VerificationDocumentMetaData[];
  thisTableIsFor: string;
  onApprove: (row: VerificationDocumentMetaData) => void;
  onReject: (row: VerificationDocumentMetaData, rejectReason: string,) => void;
  onDelete: (row: VerificationDocumentMetaData) => void;
}

export default function ValidationTable({
  data,
  thisTableIsFor,
  onApprove,
  onDelete,
  onReject,
}: ValidationTableInterface) {
  const tableConfig = React.useMemo(
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
    <DataTable<VerificationDocumentMetaData>
      data={data ?? []}
      tableConfig={tableConfig}
      emptyTableMessage="No validations found."
      enableGlobalSearch
    />
  );
}

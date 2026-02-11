import React from 'react';
import { Button, Flex, useDisclosure } from '@chakra-ui/react';
import { VerificationDocumentMetaData } from '@/infrastructure/documents/documents.type';
import ModalWrapper from '@/features/shared/components/modal-wrapper/ModalWrapper';
import DialogWrapper from '@/features/shared/components/dialog-wrapper/DialogWrapper';
import ValidationInfo from './ValidationInfo';

interface Props {
  rowData: VerificationDocumentMetaData;
  onApprove: (row: VerificationDocumentMetaData) => void;
  onReject: (row: VerificationDocumentMetaData) => void;
  onDelete: (row: VerificationDocumentMetaData) => void;
}

export default function ValidationTableRowActionsConfig({
  rowData,
  onApprove,
  onReject,
  onDelete,
}: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isConfirmOpen,
    onOpen: onConfirmOpen,
    onClose: onConfirmClose,
  } = useDisclosure();

  const handleConfirmApprove = () => {
    onApprove(rowData);
    onConfirmClose();
    onClose();
  };

  return (
    <>
      <Button size="sm" onClick={onOpen}>
        Details
      </Button>

      {isOpen && (
        <ModalWrapper isOpen={isOpen} onClose={onClose} showCloseButton>
          <ValidationInfo permitId={rowData.id} />
        </ModalWrapper>
      )}
    </>
  );
}

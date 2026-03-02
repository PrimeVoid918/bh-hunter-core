import { Colors } from '@/pages/constants';
import {
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  useColorMode,
  ChakraProps,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import { SerializedStyles } from '@emotion/react';
import React, { ReactNode } from 'react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  cssStyles?: SerializedStyles;
  chakraStyling?: ChakraProps;
  children: ReactNode;
}

export default function ModalWrapper({
  isOpen,
  onClose,
  closeOnOverlayClick,
  closeOnEsc,
  showCloseButton = false,
  cssStyles,
  chakraStyling,
  children,
}: ModalWrapperProps) {
  const { colorMode } = useColorMode();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      isCentered
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEsc={closeOnEsc}
    >
      <ModalOverlay />
      <FloatingModalContent
        colorMode={colorMode}
        minH="25dvh"
        cssStyles={cssStyles}
        sx={chakraStyling}
      >
        {showCloseButton && <ModalCloseButton zIndex={99} />}
        <ModalBody display="flex" flex="1" p={0} minH="0">
          {children}
        </ModalBody>
      </FloatingModalContent>
    </Modal>
  );
}

const FloatingModalContent = styled(ModalContent)<{
  colorMode: string;
  cssStyles?: SerializedStyles;
}>`
  border: 1px solid yellow;
  height: auto;
  max-height: 80vh; /* limit height to viewport */
  min-width: 30rem;
  max-width: 30rem;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  background-color: ${({ colorMode }) =>
    colorMode === 'light'
      ? Colors.PrimaryLight[4]
      : Colors.PrimaryLight[8]} !important;

  /* ----------------- RESPONSIVE BREAKPOINTS ----------------- */
  @media (max-width: 768px) {
    /* Mobile/tablet layout: stack PDF and details vertically */
    min-width: 95%; /* override if needed */
    max-width: 95%;
  }

  @media (max-width: 480px) {
    /* Small phones */
    min-width: 95%;
    max-width: 95%;
    border-radius: 0.5rem;
  }

  /* Optional: tablet / desktop tweaks */
  @media (min-width: 1200px) {
    max-width: 85%; /* optional wider modal for large screens */
  }

  ${({ cssStyles }) => cssStyles};
`;

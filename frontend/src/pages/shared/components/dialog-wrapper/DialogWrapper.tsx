import { Colors } from '@/pages/constants';
import {
  ChakraProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useColorMode,
} from '@chakra-ui/react';
import { SerializedStyles } from '@emotion/react';
import styled from '@emotion/styled';
import React from 'react';

export interface DialogWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  cssStyles?: SerializedStyles;
  chakraStyling?: ChakraProps;
  header?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function DialogWrapper({
  isOpen,
  onClose,
  closeOnOverlayClick,
  closeOnEsc,
  showCloseButton = false,
  cssStyles,
  chakraStyling,
  header,
  children,
  footer,
}: DialogWrapperProps) {
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
        {...chakraStyling}
      >
        {header && (
          <>
            <ModalHeader display={'flex'} justifyContent={'center'}>
              {header}
            </ModalHeader>
            <hr
              style={{
                padding: 0,
                borderTopWidth: '3px',
                borderTopColor:
                  colorMode === 'light'
                    ? Colors.PrimaryLight[7]
                    : Colors.PrimaryLight[5],
              }}
            ></hr>
          </>
        )}
        {showCloseButton && <ModalCloseButton zIndex={99} />}
        <ModalBody display="flex" flex="1" p={0} minH="0">
          {children}
        </ModalBody>
        {footer && (
          <>
            <hr
              style={{
                borderTopWidth: '3px',
                borderTopColor:
                  colorMode === 'light'
                    ? Colors.PrimaryLight[7]
                    : Colors.PrimaryLight[5],
              }}
            ></hr>
            <ModalFooter w="100%" justifyContent="center">
              {footer}
            </ModalFooter>
          </>
        )}
      </FloatingModalContent>
    </Modal>
  );
}

const FloatingModalContent = styled(ModalContent)<{
  colorMode: string;
  cssStyles?: SerializedStyles;
}>`
  height: auto;
  max-height: 80vh; /* limit height to viewport */
  min-width: 30rem;
  max-width: 30rem;
  border-radius: 1rem;
  /* overflow: scroll; */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  background-color: ${({ colorMode }) =>
    colorMode === 'light'
      ? Colors.PrimaryLight[4]
      : Colors.PrimaryLight[8]} !important;

  > :nth-of-type(1) {
    > :nth-of-type(1) {
    }
  }

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

  ${({ cssStyles }) => cssStyles}; //* Custom styles
`;

//* Usage
/*

 const {
    isOpen: isOpenDialog,
    onClose: onCloseDialog,
    onOpen: onOpenDialog,
  } = useDisclosure();


 <DialogWrapper
  isOpen={isOpenDialog}
  onClose={onCloseDialog}
  closeOnOverlayClick={false}
  closeOnEsc={false}
  header="Logout"
  dimension={{ width: '25dvw', height: '30dvh' }}
  footer={
    <Flex justify={'space-between'} width={'100%'}>
      <Button onClick={onCloseDialog}>Cancel</Button>
      <Button onClick={handleLogout}>Logout</Button>
    </Flex>
  }
>
  <div>Are you sure you want to Logout?</div>
</DialogWrapper>
*/

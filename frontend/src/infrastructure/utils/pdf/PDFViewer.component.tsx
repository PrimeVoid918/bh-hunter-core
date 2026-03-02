import { Document, Page } from 'react-pdf';
import { Box, Spinner, Center, useColorMode } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Colors } from '@/pages/constants';
import { useBreakpointValue } from '@chakra-ui/react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
} from '@chakra-ui/react';

type PdfViewerProps = {
  url: string;
  width?: number | string;
  height?: number | string;
  pageNumber?: number;
  scale?: number;
};

export function PdfViewer({
  url,
  width = '100%',
  height = '600px',
  pageNumber = 1,
  scale = 1.0,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [fileData, setFileData] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [renderPdf, setRenderPdf] = useState(false);
  const { colorMode } = useColorMode();
  const [fullscreen, setFullscreen] = useState(false);

  const responsiveScale =
    useBreakpointValue({
      base: 0.5, // Mobile: pages take ~50% of screen width
      sm: 0.7, // Small tablets
      md: 0.9, // Medium tablets
      lg: 1.0, // Desktop
      xl: 1.2, // Large desktop
    }) || scale;

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setLoading(true);
        const stripped = url.split('/media')[1];
        // console.log('stripped', stripped);
        const res = await fetch('/media' + stripped, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch PDF');
        const blob = await res.blob();
        setFileData(blob);
      } catch (err) {
        console.error('Failed to fetch PDF:', err);
        setFileData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();
  }, [url]);

  useEffect(() => {
    setRenderPdf(false);
    const id = setTimeout(() => setRenderPdf(true), 50); // wait 50ms for cleanup
    return () => clearTimeout(id);
  }, [fileData]);

  if (loading) {
    return (
      <Center width={width} height={height}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!fileData) {
    return (
      <Box width={width} height={height}>
        Failed to load PDF
      </Box>
    );
  }

  return (
    <>
      <View w={width} h={height} colorMode={colorMode}>
        <Button
          size="sm"
          onClick={() => setFullscreen(true)}
          className="fullscreen-button"
        >
          Open Fullscreen
        </Button>
        {/* Inline preview */}
        {renderPdf && (
          <Document
            key={url}
            file={fileData}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          >
            {Array.from({ length: numPages }, (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                scale={responsiveScale}
              />
            ))}
          </Document>
        )}
      </View>

      {/* Fullscreen modal with iframe */}
      <Modal
        isOpen={fullscreen}
        onClose={() => setFullscreen(false)}
        size="full"
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          maxW="100%"
          maxH="100%"
          h="100vh"
          overflow="hidden"
          padding={'2rem'}
          backgroundColor={
            colorMode === 'light'
              ? Colors.PrimaryLight[4]
              : Colors.PrimaryLight[10]
          }
        >
          <ModalCloseButton />
          <ModalBody>
            <PDFIframe className="iframe" src={url} title="PDF Fullscreen" />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

const View = styled.div<{
  w?: string | number;
  h?: string | number;
  colorMode: 'light' | 'dark';
}>`
  width: ${({ w }) => w || '100%'};
  height: ${({ h }) => h || '200px'};
  position: relative;

  > .react-pdf__Document {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    > .react-pdf__Page {
      background-color: transparent !important;
    }
  }
  scrollbar-width: none;

  .fullscreen-button {
    background-color: ${({ colorMode }) =>
      colorMode === 'light'
        ? Colors.PrimaryLight[4]
        : Colors.PrimaryLight[6]} !important;
    position: fixed;
    top: 0;
    right: 0;
    margin: 1rem;
    z-index: 10;
  }

  @media (max-width: 480px) {
    /* Small phones */
    min-width: 100%;
    max-width: 100%;
    border-radius: 0.5rem;
    .pdf-viewer-container {
      padding: 0.25rem;
    }
  }

  /* Target canvas inside Page */
  canvas {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    margin: 0 auto;
  }

  /* Text / annotation layers */
  .react-pdf__Page__textContent,
  .react-pdf__Page__annotations {
    pointer-events: none;
  }
`;

const PDFIframe = styled.iframe`
  border: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  height: 90%;
  /* padding: 4rem; */

  > * {
    border: 3px solid yellow;
  }
`;

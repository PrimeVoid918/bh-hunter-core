import {
  Box,
  Spinner,
  Center,
  Button,
  useColorMode,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Colors } from '@/features/constants';
import { useBreakpointValue } from '@chakra-ui/react';

type ImageViewerProps = {
  url: string;
  width?: number | string;
  height?: number | string;
};

export function ImageViewer({
  url,
  width = '100%',
  height = '600px',
}: ImageViewerProps) {
  const [loading, setLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const { colorMode } = useColorMode();
  const [fullscreen, setFullscreen] = useState(false);

  const responsiveWidth =
    useBreakpointValue({
      base: '100%',
      sm: '90%',
      md: '80%',
      lg: '70%',
      xl: '60%',
    }) || width;

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        const stripped = url.split('/media')[1];
        const res = await fetch('/media' + stripped, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch image');
        const blob = await res.blob();
        setImgSrc(URL.createObjectURL(blob));
      } catch (err) {
        console.error('Failed to load image:', err);
        setImgSrc(null);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      // revoke object URL to avoid memory leaks
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, [url]);

  if (loading) {
    return (
      <Center width={width} height={height}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!imgSrc) {
    return (
      <Box width={width} height={height}>
        Failed to load image
      </Box>
    );
  }

  return (
    <>
      <View w={responsiveWidth} h={height} colorMode={colorMode}>
        <Button
          size="sm"
          onClick={() => setFullscreen(true)}
          className="fullscreen-button"
        >
          Open Fullscreen
        </Button>
        <img
          src={imgSrc}
          alt="Preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: 4,
          }}
        />
      </View>

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
          padding="2rem"
          backgroundColor={
            colorMode === 'light'
              ? Colors.PrimaryLight[4]
              : Colors.PrimaryLight[10]
          }
        >
          <ModalCloseButton />
          <ModalBody display="flex" justifyContent="center" alignItems="center">
            <FullscreenImage src={imgSrc} alt="Fullscreen" />
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

  img {
    border-radius: 4px;
  }
`;

const FullscreenImage = styled.img`
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 4px;
`;

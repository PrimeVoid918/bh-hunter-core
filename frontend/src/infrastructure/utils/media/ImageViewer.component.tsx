import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Button,
  Dialog,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

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
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        const stripped = url.split('/media')[1];
        const res = await fetch('/media' + stripped, {
          credentials: 'include',
        });
        const blob = await res.blob();
        setImgSrc(URL.createObjectURL(blob));
      } catch (err) {
        console.error('Image Load Error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadImage();
    return () => {
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, [url]);

  if (loading)
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height,
          width,
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box
      sx={{
        width,
        height,
        position: 'relative',
        bgcolor: 'background.default',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Button
        variant="contained"
        size="small"
        startIcon={<FullscreenIcon />}
        onClick={() => setFullscreen(true)}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 5,
          borderRadius: '100px',
          bgcolor: 'rgba(255,255,255,0.7)',
          color: 'black',
          '&:hover': { bgcolor: 'white' },
        }}
      >
        View Full
      </Button>

      {imgSrc && (
        <Box
          component="img"
          src={imgSrc}
          alt="Preview"
          sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}

      {/* Fullscreen Dialog */}
      <Dialog fullScreen open={fullscreen} onClose={() => setFullscreen(false)}>
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'black',
            position: 'relative',
          }}
        >
          <IconButton
            onClick={() => setFullscreen(false)}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'white',
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.3)',
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={imgSrc ?? ''}
            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </Box>
      </Dialog>
    </Box>
  );
}

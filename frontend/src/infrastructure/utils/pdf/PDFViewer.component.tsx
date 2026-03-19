import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// import workerSrc from 'pdfjs-dist/build/pdf.worker.min?url';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
// pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
// pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

import {
  Box,
  CircularProgress,
  Button,
  Dialog,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

type PdfViewerProps = {
  url: string;
  width?: number | string;
  height?: number | string;
};

export function PdfViewer({
  url,
  width = '100%',
  height = '600px',
}: PdfViewerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [numPages, setNumPages] = useState(0);
  const [fileData, setFileData] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const fetchPdf = async () => {
      if (!url) {
        console.warn('PDF Viewer: url is null or undefined');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Clean URL logic from your original code
        const stripped = url.split('/media')[1];
        const res = await fetch('/media' + stripped, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const blob = await res.blob();
        setFileData(blob);
      } catch (err) {
        console.error('PDF Load Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPdf();
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
        <CircularProgress size={40} />
      </Box>
    );

  return (
    <Box
      sx={{
        width,
        height,
        position: 'relative',
        bgcolor: 'background.default',
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
          bgcolor: 'rgba(255,255,255,0.8)',
          color: 'black',
          backdropFilter: 'blur(4px)',
          '&:hover': { bgcolor: 'white' },
        }}
      >
        Expand
      </Button>

      <Box
        sx={{
          height: '100%',
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {fileData ? (
          <Document
            file={fileData}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(err) =>
              console.error('PDF Document Load Error:', err)
            }
          >
            {Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i}
                pageNumber={i + 1}
                width={isMobile ? 300 : 500}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))}
          </Document>
        ) : (
          <Box sx={{ textAlign: 'center', mt: 2 }}>No PDF available</Box>
        )}
      </Box>

      {/* Fullscreen Dialog */}
      <Dialog fullScreen open={fullscreen} onClose={() => setFullscreen(false)}>
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#525659',
          }}
        >
          <Box
            sx={{
              p: 1,
              display: 'flex',
              justifyContent: 'flex-end',
              bgcolor: 'rgba(0,0,0,0.5)',
            }}
          >
            <IconButton
              onClick={() => setFullscreen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <iframe
            src={url}
            title="PDF Fullscreen"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </Box>
      </Dialog>
    </Box>
  );
}

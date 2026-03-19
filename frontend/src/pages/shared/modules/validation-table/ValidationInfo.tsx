import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  DeleteForever as DeleteIcon,
} from '@mui/icons-material';
import { PdfViewer } from '@/infrastructure/utils/pdf/PDFViewer.component';
import { ImageViewer } from '@/infrastructure/utils/media/ImageViewer.component';
import { parseIsoDate } from '@/infrastructure/utils/parseISODate.util';
import AsyncState from '@/pages/shared/components/async-state/AsyncState';
import {
  VerificationDocumentMetaData,
  UserRoleType,
} from '@/infrastructure/documents/documents.type';
import { useGetOneQuery } from '@/infrastructure/valid-docs/valid-docs.redux.api';

interface ValidationInfoInterface {
  thisTableIsFor: string;
  permitId: number;
  onApprove: (row: VerificationDocumentMetaData) => void;
  onReject: (row: VerificationDocumentMetaData, rejectReason: string) => void;
  onDelete: (row: VerificationDocumentMetaData) => void;
  onCloseParent?: () => void; // Added callback to close the main modal
}

export default function ValidationInfo({
  permitId,
  thisTableIsFor,
  onApprove,
  onReject,
  onDelete,
  onCloseParent,
}: ValidationInfoInterface) {
  const theme = useTheme();
  const {
    data: permitData,
    isLoading,
    isError,
    error,
  } = useGetOneQuery({
    userType: thisTableIsFor as UserRoleType,
    documentId: permitId,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    'APPROVE' | 'REJECT' | 'DELETE' | null
  >(null);
  const [rejectReason, setRejectReason] = useState('');

  const permitDate = parseIsoDate(permitData?.createdAt);

  const handleExecuteAction = () => {
    if (!permitData || !selectedAction) return;

    if (selectedAction === 'APPROVE') onApprove(permitData);
    else if (selectedAction === 'REJECT') onReject(permitData, rejectReason);
    else if (selectedAction === 'DELETE') onDelete(permitData);

    setConfirmOpen(false);
    onCloseParent?.(); // Close the detail view after action
  };

  return (
    <AsyncState isLoading={isLoading} isError={isError} error={error}>
      {permitData && (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ height: '80vh', minHeight: 600 }}
        >
          {/* LEFT SIDE: DOCUMENT VIEWER */}
          <Box
            sx={{
              flex: 2,
              bgcolor: 'background.default',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              p: 1,
            }}
          >
            <Box
              sx={{
                flex: 1,
                borderRadius: 2,
                overflowY: 'auto',
                border: '1px solid',
                // borderColor: 'outlineVariant',
                bgcolor: '#f0f0f0', // Neutral ground for documents
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {permitData.fileFormat === 'PDF' ? (
                <PdfViewer url={permitData.url} />
              ) : (
                <ImageViewer url={permitData.url} />
              )}
            </Box>
          </Box>

          {/* RIGHT SIDE: INFO & ACTIONS */}
          <Stack
            sx={{
              flex: 1,
              // borderLeft: '1px solid',
              // borderColor: 'outlineVariant',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
              <Typography
                variant="overline"
                color="text.secondary"
                fontWeight={700}
              >
                Document Details
              </Typography>
              <Typography variant="h6" fontWeight={800} gutterBottom>
                {permitData.verificationType.replace('_', ' ')}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <InfoRow
                  label="Owner"
                  value={`${permitData.user.firstname} ${permitData.user.lastname}`}
                />
                <InfoRow label="Status" value={permitData.verificationStatus} />
                <InfoRow
                  label="Submitted"
                  value={permitDate?.dateOnly ?? '—'}
                />
                <InfoRow label="Doc ID" value={`#${permitData.id}`} />
              </Stack>
            </Box>

            {/* ACTION FOOTER */}
            <Box
              sx={{
                p: 2,
                borderColor: 'outlineVariant',
                bgcolor: 'background.default',
              }}
            >
              <Stack direction="row" spacing={1}>
                {permitData.verificationStatus === 'PENDING' ? (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon />}
                      onClick={() => {
                        setSelectedAction('APPROVE');
                        setConfirmOpen(true);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon />}
                      onClick={() => {
                        setSelectedAction('REJECT');
                        setConfirmOpen(true);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setSelectedAction('DELETE');
                      setConfirmOpen(true);
                    }}
                  >
                    Delete Record
                  </Button>
                )}
              </Stack>
            </Box>
          </Stack>

          {/* CONFIRMATION DIALOG */}
          <Dialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400 } }}
          >
            <DialogTitle sx={{ fontWeight: 800 }}>
              Confirm {selectedAction?.toLowerCase()}?
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">
                Are you sure you want to {selectedAction?.toLowerCase()} the{' '}
                {permitData.verificationType} for {permitData.user.firstname}?
              </Typography>
              {selectedAction === 'REJECT' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Reason for rejection"
                  variant="outlined"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  sx={{ mt: 3 }}
                />
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => setConfirmOpen(false)}
                sx={{ color: 'text.secondary' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color={selectedAction === 'APPROVE' ? 'success' : 'error'}
                onClick={handleExecuteAction}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      )}
    </AsyncState>
  );
}

// Small helper component for the list items
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, display: 'block' }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}

// UsersTableRowActionsConfig.tsx
import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Box,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import UserTableInfo from './UserTableInfo';
import { UserTableRow } from './UsersTable';

interface Props {
  rowData: UserTableRow;
  thisTableIsFor: 'OWNER' | 'TENANT';
  onSuspend: (row: UserTableRow) => void;
  onDelete: (row: UserTableRow) => void;
}

export default function UsersTableRowActionsConfig({
  rowData,
  thisTableIsFor,
  onSuspend,
  onDelete,
}: Props) {
  const theme = useTheme();

  // Dialog open state
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={handleOpen}
        startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
        sx={{
          borderRadius: '100px',
          fontWeight: 600,
          textTransform: 'none',
          fontSize: '0.75rem',
          px: 2,
          borderColor: 'outlineVariant',
          color: 'text.primary',
          '&:hover': {
            bgcolor: 'primaryContainer',
            borderColor: 'primary.main',
          },
        }}
      >
        Details
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'outlineVariant',
            boxShadow: 'none',
            backgroundImage: 'none',
          },
        }}
      >
        {/* Close Button */}
        <Box sx={{ position: 'absolute', right: 12, top: 12, zIndex: 10 }}>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'outlineVariant',
              '&:hover': { bgcolor: 'error.light', color: 'white' },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          <UserTableInfo
            rowData={rowData}
            thisTableIsFor={thisTableIsFor}
            onSuspend={onSuspend}
            onDelete={onDelete}
            onCloseParent={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

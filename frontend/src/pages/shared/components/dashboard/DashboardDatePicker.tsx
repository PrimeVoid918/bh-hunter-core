import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import { Calendar as CalendarIcon, ChevronDown, Filter } from 'lucide-react';

interface DashboardDatePickerInterface {
  onFilterChange: (params: {
    timeframe?: 'week' | 'month';
    from?: string;
    to?: string;
  }) => void;
}

export default function DashboardDatePicker({
  onFilterChange,
}: DashboardDatePickerInterface) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [label, setLabel] = useState('This Month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customRange, setCustomRange] = useState({ from: '', to: '' });

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const selectPreset = (type: 'week' | 'month', display: string) => {
    setLabel(display);
    onFilterChange({ timeframe: type });
    handleCloseMenu();
  };

  const handleApplyCustom = () => {
    setLabel(`${customRange.from} — ${customRange.to}`);
    onFilterChange({ from: customRange.from, to: customRange.to });
    setIsModalOpen(false);
    handleCloseMenu();
  };

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleOpenMenu}
        startIcon={<CalendarIcon size={18} />}
        endIcon={<ChevronDown size={16} />}
        sx={{
          borderRadius: '100px',
          borderColor: 'outlineVariant',
          color: 'text.primary',
          px: 2,
          fontWeight: 600,
          textTransform: 'none',
          bgcolor: 'background.paper',
        }}
      >
        {label}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            borderRadius: 3,
            mt: 1,
            minWidth: 180,
            border: '1px solid',
            borderColor: 'outlineVariant',
            boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
          },
        }}
      >
        <MenuItem onClick={() => selectPreset('week', 'This Week')}>
          This Week
        </MenuItem>
        <MenuItem onClick={() => selectPreset('month', 'This Month')}>
          This Month
        </MenuItem>
        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
        <MenuItem onClick={() => setIsModalOpen(true)}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Filter size={14} />
            <Typography variant="body2">Custom Filter</Typography>
          </Stack>
        </MenuItem>
      </Menu>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Select Date Range</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              type="date"
              label="Start Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={customRange.from}
              onChange={(e) =>
                setCustomRange({ ...customRange, from: e.target.value })
              }
            />
            <TextField
              type="date"
              label="End Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={customRange.to}
              onChange={(e) =>
                setCustomRange({ ...customRange, to: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyCustom}
            disabled={!customRange.from || !customRange.to}
          >
            Apply Filter
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

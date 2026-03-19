import React, { useState, useMemo, useRef } from 'react';
import {
  DataTable as PrimeDataTable,
  DataTableFilterMeta,
  DataTableValueArray,
} from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import styled from '@emotion/styled';
import {
  useTheme,
  Box,
  TextField,
  InputAdornment,
  Divider,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { TableProps } from './types';

// Import PrimeReact Core (Keep these)
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

export default function DataTable<T>({
  data,
  tableConfig,
  emptyTableMessage,
  enableGlobalSearch = false,
  headerButtonSlot,
  setPageIndex = () => {},
}: TableProps<T>) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Data Flattening Logic (Keep your existing logic, it's solid)
  const processedData = useMemo(() => {
    return data.map((row: any) => {
      const flattenedRow = { ...row };
      tableConfig.forEach((config) => {
        if (config.resolveValue) {
          flattenedRow[config.field] = config.resolveValue(row);
        } else if (config.field.includes('.')) {
          flattenedRow[config.field] = config.field
            .split('.')
            .reduce((acc, part) => acc?.[part], row);
        }
      });
      return flattenedRow;
    });
  }, [data, tableConfig]);

  // 2. Filter Logic
  const initialFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ...Object.fromEntries(
      tableConfig.map((col) => [
        col.field,
        {
          value: null,
          matchMode: col.filterMatchMode ?? FilterMatchMode.CONTAINS,
        },
      ]),
    ),
  };

  const [filters, setFilters] = useState<DataTableFilterMeta>(initialFilters);
  const [globalFilterValue, setGlobalFilterValue] = useState<string>('');

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const _filters = { ...filters };
    (_filters['global'] as any).value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // 3. M3 Header Design
  const renderHeader = () => (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextField
          size="small"
          placeholder="Global search..."
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          autoComplete="off"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: '100px', bgcolor: 'background.default' },
            },
          }}
          sx={{ width: 300 }}
        />
        <Box>{headerButtonSlot}</Box>
      </Box>
      <Divider />
    </Box>
  );

  return (
    <StyledTableWrapper theme={theme}>
      <PrimeDataTable
        value={processedData as DataTableValueArray}
        paginator
        rows={10}
        onPage={(e) => setPageIndex(e.page ?? 0)}
        dataKey="id"
        filters={filters}
        filterDisplay="row"
        globalFilterFields={tableConfig
          .filter((c) => c.field !== 'actions')
          .map((c) => c.field)}
        header={enableGlobalSearch ? renderHeader() : undefined}
        emptyMessage={
          <Typography
            variant="body2"
            sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}
          >
            {emptyTableMessage || 'No records found.'}
          </Typography>
        }
        scrollable
        scrollHeight="flex"
        className="bh-hunter-table"
      >
        {tableConfig.map((config, index) => (
          <Column
            key={index}
            field={config.field}
            header={config.columnName}
            filter={!!config.filterType}
            showFilterMenu={false}
            body={(rowData) => {
              if (config.body) return config.body(rowData);
              if (config.actionComponent)
                return (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {config.actionComponent(rowData)}
                  </Box>
                );
              return (
                <Typography variant="body2">
                  {rowData[config.field] ?? '—'}
                </Typography>
              );
            }}
            style={{ minWidth: '12rem' }}
          />
        ))}
      </PrimeDataTable>
    </StyledTableWrapper>
  );
}

// 4. CSS Overrides to kill the "Prime" look and inject "BH Hunter" look
const StyledTableWrapper = styled.div<{ theme: any }>`
  width: 100%;
  height: 100%;

  .p-datatable.bh-hunter-table {
    .p-datatable-header {
      background: transparent;
      border: none;
      padding: 0;
    }

    .p-datatable-thead > tr > th {
      background: ${({ theme }) => theme.palette.background.default};
      color: ${({ theme }) => theme.palette.text.secondary};
      font-family: 'Poppins', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid ${({ theme }) => theme.palette.outlineVariant};
      padding: 1rem;
    }

    .p-datatable-tbody > tr {
      background: ${({ theme }) => theme.palette.background.paper};
      transition: background 0.2s;

      &:hover {
        background: ${({ theme }) =>
          theme.palette.primary.light}33; // 20% opacity
      }

      > td {
        padding: 1rem;
        border-bottom: 1px solid ${({ theme }) => theme.palette.outlineVariant};
      }
    }

    /* Paginator Styling */
    .p-paginator {
      background: transparent;
      border: none;
      padding: 1rem;
      justify-content: flex-end;

      .p-paginator-page,
      .p-paginator-next,
      .p-paginator-last,
      .p-paginator-first,
      .p-paginator-prev {
        border-radius: 100px;
        min-width: 32px;
        height: 32px;
        margin: 0 4px;
        border: none;
        color: ${({ theme }) => theme.palette.text.primary};

        &.p-highlight {
          background: ${({ theme }) => theme.palette.primary.main};
          color: white;
        }
      }
    }
  }
`;

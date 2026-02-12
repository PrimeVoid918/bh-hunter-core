import React, { useState } from 'react';
import {
  DataTable as PrimeDataTable,
  DataTableFilterMeta,
  DataTableValueArray,
} from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import styled from '@emotion/styled';
import { BorderRadius, Colors, Spacing } from '@/features/constants';
import { useColorMode } from '@chakra-ui/react';
import { TableProps } from './types';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import 'primeicons/primeicons.css';

export default function DataTable<T>({
  data,
  tableConfig,
  emptyTableMessage,
  enableGlobalSearch = false,
  headerButtonSlot,
  setPageIndex = () => {},
}: TableProps<T>) {
  const { colorMode } = useColorMode();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const typedData = data as DataTableValueArray;

  // PROCESS DATA FOR SEARCHABILITY
  const processedData = React.useMemo(() => {
    return data.map((row: any) => {
      const flattenedRow = { ...row };

      tableConfig.forEach((config) => {
        // 1. If a custom resolver exists (e.g., for Full Name)
        if (config.resolveValue) {
          flattenedRow[config.field] = config.resolveValue(row);
        }
        // 2. If it's a nested dot-notation field (e.g., "user.email")
        else if (config.field.includes('.')) {
          flattenedRow[config.field] = config.field
            .split('.')
            .reduce((acc, part) => acc?.[part], row);
        }
      });

      return flattenedRow;
    });
  }, [data, tableConfig]);

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
  // const initialFilters: DataTableFilterMeta = {
  //   global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  //   ...Object.fromEntries(
  //     tableConfig.map((col) => [
  //       col.field,
  //       {
  //         value: null,
  //         matchMode: col.filterMatchMode ?? FilterMatchMode.CONTAINS,
  //       },
  //     ]),
  //   ),
  // };

  const [filters, setFilters] = useState<DataTableFilterMeta>(initialFilters);
  const [globalFilterValue, setGlobalFilterValue] = useState<string>('');

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // clone current filters
    const _filters = { ...filters };
    // assign to global
    _filters['global'].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
    <div className="global-filter">
      <div>
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Keyword Search"
          />
        </IconField>
        <div>{headerButtonSlot}</div>
      </div>
      <hr></hr>
    </div>
  );

  return (
    <TableContainer colorMode={colorMode} ref={containerRef}>
      <PrimeDataTable
        value={processedData as DataTableValueArray}
        // value={typedData}
        paginator
        rows={10}
        onPage={(e) => setPageIndex(e.page ?? 0)}
        dataKey="id"
        filters={filters}
        filterDisplay="row"
        // globalFilterFields={tableConfig
        //   .filter((c) => c.field !== 'actions')
        //   .map((c) => c.field as string)}
        globalFilterFields={tableConfig
          .filter((c) => c.field !== 'actions')
          .map((c) => c.field)}
        header={enableGlobalSearch ? renderHeader() : undefined}
        emptyMessage={emptyTableMessage}
        scrollable
        scrollHeight="flex" // or a fixed px height if you prefer
        style={{ flex: 1 }}
      >
        {tableConfig.map((config, index) => (
          <Column
            key={index}
            // field={config.field as string}
            field={config.field}
            header={config.columnName}
            filter={!!config.filterType} // only true if filterType exists
            filterPlaceholder={config.placeholder}
            showFilterMenu={
              !(
                config.filterType === 'dropdown' ||
                config.filterType === 'input'
              )
            }
            filterElement={
              config.filterElement
                ? (options) =>
                    config.filterElement!(options, containerRef.current)
                : undefined
            }
            // body={
            //   config.body
            //     ? (rowData) => config.body!(rowData)
            //     : config.actionComponent
            //       ? (rowData) => (
            //           <div
            //             style={{ display: 'flex', gap: '1rem' }}
            //             className="actions"
            //           >
            //             {config.actionComponent!(rowData)}
            //           </div>
            //         )
            //       : (rowData) => <>{(rowData as any)[config.field]}</>
            // }
            body={(rowData) => {
              if (config.body) return config.body(rowData);
              if (config.actionComponent)
                return (
                  <div className="actions">
                    {config.actionComponent(rowData)}
                  </div>
                );
              // Fallback to the resolved/flattened value
              return <>{rowData[config.field] ?? ''}</>;
            }}
            style={{ minWidth: '14rem' }}
          />
        ))}
      </PrimeDataTable>
    </TableContainer>
  );
}

const TableContainer = styled.div<{ colorMode: string }>`
  --bg-color: ${({ colorMode }) =>
    colorMode === 'light' ? Colors.PrimaryLight[2] : Colors.PrimaryLight[8]};

  background-color: var(--bg-color);
  display: flex;
  flex-direction: column;
  min-height: 88dvh;
  max-height: 88dvh;
  border: 2px solid
    ${({ colorMode }) =>
      colorMode === 'light' ? Colors.PrimaryLight[7] : Colors.PrimaryLight[5]};
  padding: 1rem;
  border-radius: 1rem;

  > :nth-of-type() {
    display: flex;
    flex-direction: column;

    > :nth-of-type(1) {
      flex: 1;

      scrollbar-width: 100px;
      scrollbar-color: ${({ colorMode }) =>
        colorMode === 'light'
          ? `color-mix(in srgb, var(--dark), black 60%) transparent`
          : `color-mix(in srgb, var(--light), white 45%) transparent`};
    }

    > :nth-of-type(2) {
      margin-top: auto;
      display: flex;
      flex-direction: row;
      gap: 1rem;
      justify-content: center;
      justify-self: flex-end;
      padding: 1rem;
      > :nth-of-type(1) {
      }
    }
  }

  --light: ${Colors.PrimaryLight[9]};
  --dark: ${Colors.PrimaryLight[3]};
  --light-highlight: ${Colors.PrimaryLight[6]};
  --dark-highlight: ${Colors.PrimaryLight[5]};
  --text-l: ${Colors.TextInverse[5]};
  --text-d: ${Colors.TextInverse[2]};
  --border-color: ${Colors.PrimaryLight[9]};
  --debug-border-color: green;
  --hidden-button-width: 1rem;

  .p-datatable {
    border-radius: 8px;
    overflow: hidden;
    background: var(--color1);
  }

  //* Table Header & Filters

  .p-datatable-thead > tr:nth-of-type(2) > th.p-filter-column,
  .p-datatable-thead > tr:nth-of-type(1) > th > *,
  .p-datatable-thead > tr:nth-of-type(2) > th > * {
    /* border: 3px solid green; */
    background: ${({ colorMode }) =>
      colorMode === 'light' ? Colors.PrimaryLight[2] : Colors.PrimaryLight[8]};
    &:not(th.p-filter-column) {
      border-bottom: 2px solid
        ${({ colorMode }) =>
          colorMode === 'dark'
            ? Colors.PrimaryLight[2]
            : Colors.PrimaryLight[8]};
      max-height: 4rem;
      min-height: 4rem;
    }
  }

  .global-filter {
    padding: 0rem 1rem 0rem 0rem;
    gap: 1rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    > hr {
      width: 100%;
      border-bottom: 2px solid
        ${({ colorMode }) =>
          colorMode === 'dark'
            ? Colors.PrimaryLight[2]
            : Colors.PrimaryLight[8]};
    }

    > div {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;

      > :nth-of-type(2) {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      > .p-icon-field {
        width: auto;
        > span {
          padding: 1rem 1rem;
        }
        > input {
          background-color: transparent;
          padding: 0.5rem 1rem 0.5rem 0.5rem;
          color: ${({ colorMode }) =>
            colorMode === 'dark'
              ? Colors.TextInverse[2]
              : Colors.TextInverse[5]};
          &::placeholder {
            color: ${({ colorMode }) =>
              colorMode === 'dark'
                ? Colors.TextInverse[3]
                : Colors.TextInverse[4]};
            opacity: 1; // ✅ Some browsers (esp. Firefox) need this
          }
        }
      }
    }

    > div {
      > :nth-of-type(1) {
        overflow: hidden;
        border-radius: 0.5rem;
        background: ${({ colorMode }) =>
          colorMode === 'light'
            ? Colors.PrimaryLight[3]
            : Colors.PrimaryLight[9]};
      }
    }
  }

  .p-datatable-thead > tr:nth-of-type(1) > th > * {
    padding: 1rem 1.5rem;
    font-weight: 600;

    /* wrapping */
    white-space: nowrap; /* don’t wrap words */
    min-width: 8rem; /* adjust based on your shortest header */
    text-overflow: ellipsis; /* optional: show "…" when too small */
    overflow: hidden; /* needed for ellipsis to work */
  }

  .p-datatable-thead > tr:nth-of-type(2) > th > * {
    padding: 0.75rem 1rem;

    display: flex;
    flex-direction: row;
    gap: ${Spacing.md};
    > *:nth-of-type(1) {
      input {
        padding: ${Spacing.sm};
        border-radius: ${BorderRadius.md};
        background: ${({ colorMode }) =>
          colorMode === 'light'
            ? Colors.PrimaryLight[3]
            : Colors.PrimaryLight[9]};
        color: ${({ colorMode }) =>
          colorMode === 'dark' ? Colors.TextInverse[2] : Colors.TextInverse[5]};
      }
      > :nth-of-type(1) {
        display: flex;
        flex-direction: row;
        gap: ${Spacing.sm};
        > :nth-of-type(1) {
          background: ${({ colorMode }) =>
            colorMode === 'light'
              ? Colors.PrimaryLight[2]
              : Colors.PrimaryLight[9]};
          color: ${({ colorMode }) =>
            colorMode === 'dark'
              ? Colors.TextInverse[2]
              : Colors.TextInverse[5]};
          padding: ${Spacing.sm};
          border-radius: ${BorderRadius.md};
        }
      }
    }

    .p-column-filter-clear-button {
      /* border: 2px solid green; */
      width: var(--hidden-button-width);
    }
  }
  //* Table Header & Filters

  //* Body Rows
  .p-datatable-tbody > tr {
    height: 100%;
  }

  .p-datatable-tbody > tr:hover {
    background: ${({ colorMode }) =>
      colorMode === 'dark' ? Colors.PrimaryLight[7] : Colors.PrimaryLight[3]};
    color: ${({ colorMode }) =>
      colorMode === 'light' ? `var(--text-l)` : `var(--text-d) !important`};
  }

  .p-datatable-tbody > tr > td {
    padding: 0;
    height: 100%;
    vertical-align: middle;
    padding: 0rem 0rem 0rem 1rem;
  }

  .p-datatable-tbody > tr > td > * {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 0.8rem 0.5rem;
    box-sizing: border-box;

    &:not(.actions) {
      padding: 0.8rem 1rem;
      justify-content: start;
    }
  }

  //* Body Rows

  //* Buttons

  //* Buttons

  //* Paginator
  .p-paginator {
    border-top: 1px solid #e5e7eb;
    padding: 0.5rem;
    justify-content: center; /* align to right */
  }

  .p-paginator .p-paginator-page {
    border-radius: 6px;
    margin: 0 2px;
  }

  .p-paginator .p-highlight {
    background-color: ${({ colorMode }) =>
      colorMode === 'light' ? `var(--light)` : `var(--dark) !important`};
    padding: 0.2rem 0.6rem;
    color: ${({ colorMode }) =>
      colorMode === 'dark' ? `var(--text-l)` : `var(--text-d) !important`};
  }
  //* Paginator

  //* Tags and Badges
  .p-tag {
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
  //* Tags and Badges

  //* Dropdown Styles
  .status-panel {
    border-radius: 8px;
    background-color: ${({ colorMode }) =>
      colorMode === 'light'
        ? `color-mix(in srgb, var(--dark), black 10%)`
        : `color-mix(in srgb, var(--light), black 10%)`};
    border: 2px solid
      ${({ colorMode }) =>
        colorMode === 'light'
          ? `color-mix(in srgb, var(--dark), black 10%)`
          : `color-mix(in srgb, var(--light), black 25%)`};
  }
  .status-panel .p-dropdown-items {
    > *:hover {
      background-color: ${({ colorMode }) =>
        colorMode === 'dark'
          ? `color-mix(in srgb, var(--dark), black 10%)`
          : `color-mix(in srgb, var(--light), white 30%)`};
      color: ${({ colorMode }) =>
        colorMode === 'dark' ? `var(--text-l)` : `var(--text-d) !important`};
    }
  }
  .status-panel .p-dropdown-item {
    padding: 0.5rem 0.75rem;
  }
  .status-panel .p-dropdown-item.p-highlight {
    background-color: ${({ colorMode }) =>
      colorMode === 'dark'
        ? `color-mix(in srgb, var(--dark), black 60%)`
        : `color-mix(in srgb, var(--light), white 45%)`};
    color: ${({ colorMode }) =>
      colorMode === 'light' ? `var(--text-l)` : `var(--text-d) !important`};
  }
  //* Dropdown Styles
`;

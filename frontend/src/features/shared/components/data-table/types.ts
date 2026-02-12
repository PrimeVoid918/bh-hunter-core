import { ColumnFilterElementTemplateOptions } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';

/**
 * Allowed filter match modes from PrimeReact.
 */
export type FilterMatchModeType =
  (typeof FilterMatchMode)[keyof typeof FilterMatchMode];

/**
 * Type of filter to display in the table column.
 */
export type FilterType = 'input' | 'dropdown' | 'date' | undefined;

/**
 * Configuration for a single table column.
 *
 * @template T - The type of the row data object.
 */
export interface TableConfig<T> {
  /** Display name of the column in the table header */
  columnName: string;

  /** Key of the field in row data or 'actions' for custom action buttons */
  field: keyof T | 'actions';

  /** Options for a dropdown filter (used when `filterType` is 'dropdown') */
  dropdownOptions?: string[];

  /** Placeholder text for input-based filters */
  placeholder?: string;

  /** Type of filter for the column */
  filterType: FilterType;

  /** Match mode for filtering (e.g., contains, startsWith) */
  filterMatchMode?: FilterMatchModeType;

  // This is the magic: it tells the table how to "calculate" a searchable value
  resolveValue?: (rowData: T) => string | number | null | undefined;

  /**
   * Custom rendering function for the filter element.
   * Receives options from PrimeReact and should return a JSX element.
   */
  // filterElement?: (options: ColumnFilterElementTemplateOptions) => JSX.Element;
  filterElement?: (
    options: ColumnFilterElementTemplateOptions,
    appendTo?: HTMLElement | null,
  ) => JSX.Element;

  /**
   * Optional custom rendering for action buttons or components.
   * Receives the row data object and should return JSX.
   */
  actionComponent?: (
    rowData: T,

    /** Optional prop drilling value */
    thisTableIsFor?: string,
  ) => JSX.Element;

  /**
   * Optional custom cell rendering for this column.
   */
  body?: (rowData: T) => React.ReactNode;
}

/**
 * Props for a generic data table.
 *
 * @template T - The type of each row in the table.
 */
export interface TableProps<T> {
  /** Message when the table is empty */
  emptyTableMessage: string;

  /** Array of row data objects */
  data: T[];

  /** Array of column configurations */
  tableConfig: TableConfig<T>[];

  /** Enable global search */
  enableGlobalSearch?: boolean;

  headerButtonSlot?: JSX.Element;

  /** Controls Pagination */
  setPageIndex?: (index: number) => void;
}

/**
 * @example
 * ```ts
 * // Example: Using TableConfig with a Tenant table
 * const tableConfig: TableConfig<Tenant>[] = [
 *   {
 *     columnName: 'ID',
 *     field: 'id',
 *     filterType: 'input',
 *   },
 *   {
 *     columnName: 'Verified',
 *     field: 'isVerified',
 *     filterType: 'dropdown',
 *     filterElement: createFilterElement(
 *       'dropdown',
 *       [false, true],
 *       'Select Toggle',
 *       {
 *         true: 'Verified',
 *         false: 'Not Verified',
 *       },
 *     ),
 *     actionComponent(rowData) {
 *       return <>{rowData.isVerified ? 'Verified' : 'Not Verified'}</>;
 *     },
 *   },
 *   {
 *     columnName: 'Role',
 *     field: 'role',
 *     filterType: 'dropdown',
 *     filterElement: createFilterElement(
 *       'dropdown',
 *       ['Owner', 'Tenant'],
 *       'Search by Role',
 *     ),
 *   },
 *   {
 *     columnName: 'Actions',
 *     field: 'actions',
 *     filterType: undefined,
 *     filterElement: createFilterElement('none'),
 *     actionComponent: (rowData: Tenant) => (
 *       <>
 *         <Button
 *           label="Open"
 *           icon="pi pi-external-link"
 *           severity="info"
 *           size="small"
 *           style={{ backgroundColor: Colors.PrimaryLight[6] }}
 *           onClick={() => onOpenDetailsItem(rowData.id)}
 *         />
 *         <Button
 *           label="Delete"
 *           icon="pi pi-trash"
 *           severity="danger"
 *           size="small"
 *           style={{ backgroundColor: Colors.Danger[3] }}
 *           onClick={() => onDeleteItem(rowData.id)}
 *         />
 *       </>
 *     ),
 *   },
 * ];
 *
 * // Using TableProps with a DataTable component
 * <DataTable<Tenant> data={tenants} tableConfig={tableConfig} />
 * ```
 */

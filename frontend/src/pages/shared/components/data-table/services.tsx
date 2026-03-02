import { Dropdown } from 'primereact/dropdown';
// import { Dropdown as PrimeDropdown } from 'primereact/dropdown';
import { ColumnFilterElementTemplateOptions } from 'primereact/column';
import { InputText } from 'primereact/inputtext';

export function createFilterElement<T>(
  filterType: 'input' | 'dropdown' | 'none',
  optionsList?: T[],
  placeholder?: string,
  labelMap?: Record<string, string>,
) {
  return (
    options: ColumnFilterElementTemplateOptions,
    appendTo?: HTMLElement | null,
  ) => {
    switch (filterType) {
      case 'dropdown': {
        const formattedOptions =
          optionsList?.map((val) => ({
            label: labelMap?.[String(val)] ?? String(val),
            value: val,
          })) ?? [];
        return (
          <Dropdown
            value={options.value ?? ''}
            options={formattedOptions}
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder={placeholder ?? 'Select One'}
            showClear
            // className="p-column-filter-dropdown"
            panelClassName="status-panel"
            appendTo={appendTo ?? undefined}
            style={{ minWidth: '12rem' }}
          />
        );
      }
      case 'input': {
        return (
          <InputText
            value={options.value ?? ''}
            onChange={(e) => options.filterApplyCallback(e.target.value)}
            placeholder={placeholder ?? 'Search'}
            style={{ width: '100%' }}
          />
        );
      }

      case 'none':
      default: {
        return (
          <div
            className="p-column-filter p-fluid p-column-filter-row"
            style={{ width: '100%' }}
          >
            &nbsp;
          </div>
        );
      }
    }
  };
}

type FlattenOptions = {
  separator?: string; // default: '.'
  combineNestedObjects?: boolean; // default: true, merges nested object values into a single string
};

export function flattenObject(
  obj: Record<string, any>,
  options: FlattenOptions = {},
  parentKey = '',
): Record<string, any> {
  const { separator = '.', combineNestedObjects = true } = options;
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}${separator}${key}` : key;

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      if (combineNestedObjects) {
        result[newKey] = Object.values(value)
          .filter((v) => v !== null && v !== undefined)
          .join(' ');
      } else {
        // recurse into nested objects
        Object.assign(result, flattenObject(value, options, newKey));
      }
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

// transform/to-number-array.
import { Transform } from 'class-transformer';

export const ToNumberArray = () =>
  Transform(({ value }) => {
    if (!value) return undefined;

    const parse = (v: string | number): number | null => {
      const num = parseInt(String(v).trim(), 10);
      return isNaN(num) ? null : num;
    };

    if (typeof value === 'string') {
      return value
        .split(',')
        .map(parse)
        .filter((n): n is number => n !== null);
    }

    if (Array.isArray(value)) {
      return value.map(parse).filter((n): n is number => n !== null);
    }

    return [];
  });

import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

type ColumnBase = { key: string; label: string };

export type SortableColumn<T> =
  | (ColumnBase & { type?: undefined })
  | (ColumnBase & { type: "text"; value: (row: T) => string | null })
  | (ColumnBase & { type: "number"; value: (row: T) => number | null })
  | (ColumnBase & { type: "date"; value: (row: T) => string | null })
  | (ColumnBase & { type: "enum"; value: (row: T) => string | null; options: readonly string[] });

export interface SortState {
  key: string | null;
  direction: SortDirection;
  pinned: string | null;
}

const NO_SORT: SortState = { key: null, direction: "asc", pinned: null };

// Rows with no value always sink to the bottom, in both directions — a blank
// cell is "unknown", not "smallest".
function compare<T>(column: SortableColumn<T>, a: T, b: T): number {
  if (!column.type) return 0;

  const left = column.value(a);
  const right = column.value(b);
  if (left === null || left === "") return right === null || right === "" ? 0 : 1;
  if (right === null || right === "") return -1;

  switch (column.type) {
    case "number":
      return (left as number) - (right as number);
    case "date":
      return Date.parse(left as string) - Date.parse(right as string);
    case "enum": {
      const order = column.options;
      return order.indexOf(left as string) - order.indexOf(right as string);
    }
    default:
      return String(left).localeCompare(String(right));
  }
}

export function useTableSort<T>(columns: SortableColumn<T>[]) {
  const [sort, setSort] = useState<SortState>(NO_SORT);

  function sortRows(rows: T[]): T[] {
    const column = columns.find((col) => col.key === sort.key);
    if (!column || !column.type) return rows;

    const pinned = column.type === "enum" ? sort.pinned : null;
    const factor = sort.direction === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
      if (pinned) {
        const aPinned = column.value(a) === pinned;
        const bPinned = column.value(b) === pinned;
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
      }
      return compare(column, a, b) * factor;
    });
  }

  return { sort, setSort, sortRows };
}

export function useSortedRows<T>(rows: T[], columns: SortableColumn<T>[]) {
  const { sort, setSort, sortRows } = useTableSort(columns);
  const sorted = useMemo(() => sortRows(rows), [rows, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  return { sorted, sort, setSort };
}

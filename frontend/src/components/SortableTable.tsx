import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import "./SortableTable.css";

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

interface SortHeadersProps<T> {
  columns: SortableColumn<T>[];
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  children?: ReactNode;
}

export function SortHeaders<T>({ columns, sort, onSortChange, children }: SortHeadersProps<T>) {
  return (
    <tr>
      {columns.map((column) =>
        column.type ? (
          <HeaderCell key={column.key} column={column} sort={sort} onSortChange={onSortChange} />
        ) : (
          <th key={column.key}>{column.label}</th>
        ),
      )}
      {children}
    </tr>
  );
}

interface HeaderCellProps<T> {
  column: SortableColumn<T>;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
}

function HeaderCell<T>({ column, sort, onSortChange }: HeaderCellProps<T>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cellRef = useRef<HTMLTableCellElement>(null);
  const active = sort.key === column.key;

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!cellRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  function toggleDirection() {
    onSortChange({
      key: column.key,
      direction: active && sort.direction === "asc" ? "desc" : "asc",
      pinned: active ? sort.pinned : null,
    });
  }

  function pin(value: string | null) {
    onSortChange({ key: column.key, direction: "asc", pinned: value });
    setMenuOpen(false);
  }

  const indicator = active ? (sort.direction === "asc" ? "↑" : "↓") : "↕";

  return (
    <th ref={cellRef} className={`sortable-th ${active ? "active" : ""}`}>
      <div className="sortable-th-inner">
        <button type="button" className="sort-button" onClick={toggleDirection}>
          {column.label}
          <span className="sort-indicator">{indicator}</span>
        </button>

        {column.type === "enum" && (
          <button
            type="button"
            className="sort-menu-toggle"
            aria-label={`Sort ${column.label} by value`}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {"▾"}
          </button>
        )}

        {menuOpen && column.type === "enum" && (
          <div className="sort-menu">
            <button
              type="button"
              className={`sort-menu-item ${active && !sort.pinned ? "selected" : ""}`}
              onClick={() => pin(null)}
            >
              Default order
            </button>
            {column.options.map((option) => (
              <button
                key={option}
                type="button"
                className={`sort-menu-item ${active && sort.pinned === option ? "selected" : ""}`}
                onClick={() => pin(option)}
              >
                {option.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        )}
      </div>
    </th>
  );
}

export function useSortedRows<T>(rows: T[], columns: SortableColumn<T>[]) {
  const { sort, setSort, sortRows } = useTableSort(columns);
  const sorted = useMemo(() => sortRows(rows), [rows, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  return { sorted, sort, setSort };
}

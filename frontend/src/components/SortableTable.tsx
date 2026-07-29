import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { SortableColumn, SortState } from "./useSortableTable";
import "./SortableTable.css";

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

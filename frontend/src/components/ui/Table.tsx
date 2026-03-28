'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TableColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
};

export function Table<T>({ columns, data, sortBy, sortOrder, onSort, rowKey, onRowClick }: TableProps<T>) {
  return (
    <div className="app-frame overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[linear-gradient(180deg,#5d6b7b_0%,#4a5665_100%)] text-left text-xs text-app-navText">
            {columns.map((column) => (
              <th key={column.key} className={cn('border-b border-[#47525d] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em]', column.className)}>
                {column.sortable && onSort ? (
                  <button className="inline-flex items-center gap-1 text-left hover:text-white" onClick={() => onSort(column.key)} type="button">
                    {column.header}
                    <span className="text-[#d4dde4]">{sortBy === column.key ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ' ◆'}</span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-app-panel">
          {data.map((row, index) => (
            <tr
              key={rowKey(row)}
              className={cn(
                'border-b border-app-borderLight last:border-b-0',
                index % 2 === 1 && 'bg-[#f2f5f8]',
                onRowClick && 'cursor-pointer hover:bg-[#e1ecf5]',
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td key={column.key} className={cn('px-3 py-2.5 align-top text-app-text', column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

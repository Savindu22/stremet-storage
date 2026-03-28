'use client';

import type { ReactNode } from 'react';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';

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
    <TableContainer component={Paper} variant="outlined">
      <MuiTable size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            {columns.map((col) => (
              <TableCell key={col.key}>
                {col.sortable && onSort ? (
                  <TableSortLabel active={sortBy === col.key} direction={sortBy === col.key ? sortOrder : 'asc'} onClick={() => onSort(col.key)}>
                    {col.header}
                  </TableSortLabel>
                ) : (
                  col.header
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={rowKey(row)}
              hover={Boolean(onRowClick)}
              onClick={() => onRowClick?.(row)}
              sx={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((col) => (
                <TableCell key={col.key}>{col.render(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}

'use client';

import MuiPagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type PaginationProps = {
  currentPage: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, perPage, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Page {currentPage} of {totalPages} ({total} records)
      </Typography>
      <MuiPagination count={totalPages} page={currentPage} onChange={(_, page) => onPageChange(page)} size="small" shape="rounded" />
    </Stack>
  );
}

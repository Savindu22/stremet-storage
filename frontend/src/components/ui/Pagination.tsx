'use client';

import { Button } from '@/components/ui/Button';

type PaginationProps = {
  currentPage: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, perPage, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, start + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);

  return (
    <div className="app-frame flex flex-wrap items-center justify-between gap-2 px-3 py-2">
      <p className="text-[11px] font-medium text-app-textMuted">
        Page {currentPage} of {totalPages} ({total} records)
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" className="min-h-8 px-2.5 py-1 text-[11px]" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          Prev
        </Button>
        {pages.map((page) => (
          <Button key={page} variant={page === currentPage ? 'primary' : 'secondary'} className="min-h-8 min-w-8 px-2 py-1 text-[11px]" onClick={() => onPageChange(page)}>
            {page}
          </Button>
        ))}
        <Button variant="secondary" className="min-h-8 px-2.5 py-1 text-[11px]" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

import { cn, toTitleCase } from '@/lib/utils';

type BadgeProps = {
  children: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const text = children === children.toUpperCase() ? children : toTitleCase(children);

  return (
    <span
      className={cn(
        'inline-flex items-center border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
        variant === 'default' && 'border-app-border bg-app-panelMuted text-app-textMuted',
        variant === 'primary' && 'border-[#7b98b2] bg-[#d7e4ef] text-app-primary',
        variant === 'success' && 'border-[#8fb39a] bg-[#e6f0e8] text-app-success',
        variant === 'warning' && 'border-[#c0b28e] bg-[#f3f1ea] text-app-warning',
        variant === 'danger' && 'border-[#d0aaa3] bg-[#f5e9e6] text-app-danger',
        className,
      )}
    >
      {text}
    </span>
  );
}

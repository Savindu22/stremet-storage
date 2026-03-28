import Chip from '@mui/material/Chip';
import { toTitleCase } from '@/lib/utils';

type BadgeProps = {
  children: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
};

const colorMap = {
  default: 'default',
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'error',
} as const;

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const text = children === children.toUpperCase() ? children : toTitleCase(children);

  return <Chip label={text} size="small" color={colorMap[variant]} variant="outlined" />;
}

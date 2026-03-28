'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MuiButton from '@mui/material/Button';

type NavLinkProps = {
  href: string;
  label: string;
};

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <MuiButton
      component={Link}
      href={href}
      size="small"
      disableRipple
      sx={{
        color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
        bgcolor: isActive ? 'rgba(21,101,192,0.5)' : 'transparent',
        '&:hover': { bgcolor: isActive ? 'rgba(21,101,192,0.6)' : 'rgba(255,255,255,0.08)' },
        borderRadius: 0.5,
        px: 1.5,
        py: 0.5,
        minHeight: 30,
        fontWeight: isActive ? 700 : 500,
        fontSize: '0.75rem',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </MuiButton>
  );
}

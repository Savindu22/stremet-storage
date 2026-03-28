'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type NavLinkProps = {
  href: string;
  label: string;
};

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-8 items-center border border-transparent px-2.5 py-1 text-[13px] font-medium',
        isActive
          ? 'border-app-borderLight bg-white text-app-text'
          : 'text-app-navText hover:bg-white/10 hover:text-app-navActive',
      )}
    >
      {label}
    </Link>
  );
}

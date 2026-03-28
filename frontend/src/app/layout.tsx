import type { Metadata } from 'next';
import { HomeGridOnly } from '@/components/ui/HomeGridOnly';
import { NavLink } from '@/components/ui/NavLink';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stremet Storage',
  description: 'Warehouse storage management system for Stremet',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ToastProvider>
          <HomeGridOnly />
          <div className="min-h-screen bg-app-background">
            <header className="border-b border-app-border bg-app-headerBg text-app-headerText shadow-panel">
              <div className="page-shell flex flex-wrap items-center gap-2 py-1.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center border border-white/15 bg-app-primary text-[11px] font-semibold text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2)]">
                    ST
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold tracking-[0.01em] text-app-headerText">Stremet Storage</div>
                    <div className="truncate text-[11px] text-slate-300">stock, check-in, check-out, movement ledger</div>
                  </div>
                </div>
                <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-white/10 pt-1.5 sm:order-2 sm:w-auto sm:flex-1 sm:justify-center sm:border-t-0 sm:pt-0">
                  <NavLink href="/" label="Storage grid" />
                  <NavLink href="/items" label="Items" />
                  <NavLink href="/check-in" label="Check in" />
                  <NavLink href="/activity" label="Activity" />
                </nav>
              </div>
            </header>
            <main className="page-shell py-2.5">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}

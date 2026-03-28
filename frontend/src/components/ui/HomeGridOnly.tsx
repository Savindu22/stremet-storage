'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function HomeGridOnly() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') {
      document.body.classList.remove('home-grid-only');
      return;
    }

    document.body.classList.add('home-grid-only');

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;

      // Find toggle buttons and force grid view
      const buttons = Array.from(document.querySelectorAll('button'));
      const gridButton = buttons.find((b) => b.textContent?.includes('Grid view'));
      const floorButton = buttons.find((b) => b.textContent?.includes('Floor plan'));

      if (floorButton) floorButton.style.display = 'none';

      if (gridButton && !gridButton.classList.contains('Mui-selected')) {
        gridButton.click();
      }

      // Hide controls row
      const searchInput = document.getElementById('map-search');
      const controlsRow = searchInput?.closest('[class*="MuiBox"]')?.parentElement as HTMLElement | null;
      if (controlsRow) controlsRow.style.display = 'none';

      // Rename headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span'));
      for (const el of headings) {
        if (el.textContent?.trim() === 'Warehouse map') el.textContent = 'Storage grid';
        if (el.textContent?.trim() === 'Factory floor') el.textContent = 'Storage grid';
      }

      if ((gridButton && gridButton.classList.contains('Mui-selected')) || attempts > 40) {
        window.clearInterval(timer);
      }
    }, 80);

    return () => {
      window.clearInterval(timer);
      document.body.classList.remove('home-grid-only');
    };
  }, [pathname]);

  return null;
}

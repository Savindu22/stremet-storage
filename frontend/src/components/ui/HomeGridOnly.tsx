'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function findButton(label: string) {
  return Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === label) as HTMLButtonElement | undefined;
}

function findControlsRow() {
  const searchInput = document.getElementById('map-search');
  return searchInput?.closest('label')?.parentElement?.parentElement as HTMLElement | null;
}

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

      const gridButton = findButton('Grid view');
      const floorButton = findButton('Floor plan');

      if (floorButton) {
        floorButton.style.display = 'none';
      }

      if (gridButton) {
        if (!gridButton.className.includes('bg-app-primary')) {
          gridButton.click();
        }
      }

      const controlsRow = findControlsRow();
      if (controlsRow) {
        controlsRow.style.display = 'none';
      }

      const homeHeading = Array.from(document.querySelectorAll('h1, h2')).find((node) => node.textContent?.trim() === 'Warehouse map');
      if (homeHeading) {
        homeHeading.textContent = 'Storage grid';
      }

      const floorLabel = Array.from(document.querySelectorAll('div, span, p')).find((node) => node.textContent?.trim() === 'Factory floor');
      if (floorLabel) {
        floorLabel.textContent = 'Storage grid';
      }

      if ((gridButton && gridButton.className.includes('bg-app-primary')) || attempts > 40) {
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

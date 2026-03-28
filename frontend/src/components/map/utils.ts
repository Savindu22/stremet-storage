export function getOccupancyRatio(used: number, total: number) {
  if (!total) {
    return 0;
  }

  return used / total;
}

export function getOccupancyState(used: number, total: number) {
  const ratio = getOccupancyRatio(used, total);

  if (ratio > 0.8) {
    return 'danger';
  }

  if (ratio >= 0.5) {
    return 'warning';
  }

  return 'success';
}

export function getOccupancyPalette(used: number, total: number) {
  const state = getOccupancyState(used, total);

  if (state === 'danger') {
    return {
      border: '#DC2626',
      fill: '#FEE2E2',
      accent: '#B91C1C',
    };
  }

  if (state === 'warning') {
    return {
      border: '#D97706',
      fill: '#FEF3C7',
      accent: '#B45309',
    };
  }

  return {
    border: '#16A34A',
    fill: '#DCFCE7',
    accent: '#166534',
  };
}

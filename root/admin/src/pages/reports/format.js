export const money = (n) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n ?? 0);
export const compact = (n) => new Intl.NumberFormat('en-KE', { notation: 'compact', maximumFractionDigits: 1 }).format(n ?? 0);

export const METHOD = { cash: 'Cash', mpesa: 'M-Pesa' };
export const COLORS = { cash: '#d97706', mpesa: '#16a34a', bar: '#2563eb' };
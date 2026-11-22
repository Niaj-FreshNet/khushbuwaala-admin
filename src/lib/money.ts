/**
 * One way to show money across the admin (A-28).
 * Always 'en-US' digits and grouping (1,234,567), so a phone set to Bangla or another
 * language shows the same numbers as the office PC. Whole taka by default.
 */
const formatters = new Map<number, Intl.NumberFormat>();
const nf = (decimals: number) => {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals });
    formatters.set(decimals, f);
  }
  return f;
};

const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** 1234.5 -> "1,234.5" (no symbol) */
export const formatNumber = (v: unknown, decimals = 2) => nf(decimals).format(toNum(v));

/** 1234.5 -> "৳1,235"; -50 -> "-৳50" */
export const formatTaka = (v: unknown, decimals = 0) => {
  const n = toNum(v);
  return `${n < 0 ? '-' : ''}৳${nf(decimals).format(Math.abs(n))}`;
};

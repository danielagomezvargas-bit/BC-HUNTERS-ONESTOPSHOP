export const fmx = (n: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "MXN", maximumFractionDigits: 0,
  }).format(n);

export const fmtPct = (n: number | null | undefined): string =>
  n != null && !isNaN(n) ? `${Number(n).toFixed(2)}%` : "—";

export const parseNum = (s: string): number =>
  parseFloat(String(s).replace(/,/g, "").replace(/\$/g, "")) || 0;

export const avg = (arr: (number | null | undefined)[]): number | null => {
  const v = arr.filter((x): x is number => x != null && !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

export const pctOf = (n: number, total: number): string =>
  total ? `${Math.round((n / total) * 100)}%` : "0%";

export const dxStr = (d: number): string =>
  d > 0 ? `▼ ${fmx(d)}` : d < 0 ? `▲ ${fmx(Math.abs(d))}` : fmx(0);

export const dxPct = (ca: number, cm: number): string => {
  if (!ca) return "—";
  const p = ((ca - cm) / ca) * 100;
  return (p > 0 ? "▼ " : "▲ ") + Math.abs(p).toFixed(1) + "%";
};

export const dxCls = (d: number): "pos" | "neg" | "neu" =>
  d > 0 ? "pos" : d < 0 ? "neg" : "neu";

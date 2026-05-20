/** Format large currency/numbers for display without overflow. */
export function formatMoney(value, currency = "USD") {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: Math.abs(n) >= 1e9 ? "compact" : "standard",
      maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2,
    }).format(n);
  } catch {
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
}

export function formatCompactNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1e12) {
    return n.toExponential(3);
  }
  return n.toLocaleString("en-US", {
    notation: Math.abs(n) >= 1e6 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(n) >= 1e4 ? 0 : 2,
  });
}

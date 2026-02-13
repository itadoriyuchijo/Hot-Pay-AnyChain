export function formatMoney(amountLike: unknown, currency: string) {
  const amountStr = typeof amountLike === "string" ? amountLike : `${amountLike ?? ""}`;
  const n = Number(amountStr);
  const safe = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `${safe.toFixed(2)} ${currency || "USD"}`;
  }
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[,\s]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

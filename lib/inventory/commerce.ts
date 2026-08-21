export type PricedQuantity = { unitPrice: number; quantity: number };

export function calculateCartTotal(items: PricedQuantity[]) {
  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
}

export function calculateItemCount(items: Pick<PricedQuantity, "quantity">[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function nextCartQuantity(available: number, current: number, delta: number) {
  const candidate = current + delta;
  if (!Number.isInteger(available) || available < 0 || !Number.isInteger(candidate)) return null;
  if (candidate < 0 || candidate > available) return null;
  return candidate;
}

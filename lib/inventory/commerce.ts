export const MAX_CART_PRODUCTS = 150;

export type PricedQuantity = { unitPrice: number; quantity: number };
export type CartLine = { productId: string; quantity: number };
export type CartUpdateReason = "added" | "updated" | "removed" | "capacity" | "unavailable" | "invalid";
export type CartUpdate = { lines: CartLine[]; reason: CartUpdateReason };

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

export function addCartProduct(lines: CartLine[], productId: string, available: number): CartUpdate {
  const existing = lines.find((line) => line.productId === productId);
  const nextQuantity = nextCartQuantity(available, existing?.quantity ?? 0, 1);
  if (nextQuantity == null || nextQuantity === 0) return { lines, reason: "unavailable" };
  if (existing) return { lines: lines.map((line) => line.productId === productId ? { ...line, quantity: nextQuantity } : line), reason: "updated" };
  if (lines.length >= MAX_CART_PRODUCTS) return { lines, reason: "capacity" };
  return { lines: [...lines, { productId, quantity: 1 }], reason: "added" };
}

export function setCartProductQuantity(lines: CartLine[], productId: string, quantity: number, available: number): CartUpdate {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > available) return { lines, reason: "invalid" };
  if (!lines.some((line) => line.productId === productId)) return { lines, reason: "invalid" };
  if (quantity === 0) return { lines: lines.filter((line) => line.productId !== productId), reason: "removed" };
  return { lines: lines.map((line) => line.productId === productId ? { ...line, quantity } : line), reason: "updated" };
}

import { describe, expect, it } from "vitest";

import { calculateCartTotal, calculateItemCount, nextCartQuantity } from "../lib/inventory/commerce";

describe("منطق البيع المحلي", () => {
  it("يحسب إجمالي السلة وعدد الوحدات بدقة", () => {
    const items = [{ unitPrice: 12.5, quantity: 2 }, { unitPrice: 7, quantity: 3 }];
    expect(calculateCartTotal(items)).toBe(46);
    expect(calculateItemCount(items)).toBe(5);
  });

  it("يمنع رفع كمية السلة فوق المخزون المتاح", () => {
    expect(nextCartQuantity(4, 3, 1)).toBe(4);
    expect(nextCartQuantity(4, 4, 1)).toBeNull();
  });

  it("يمنع الكمية السالبة أو قيم المخزون غير الصالحة", () => {
    expect(nextCartQuantity(4, 1, -2)).toBeNull();
    expect(nextCartQuantity(-1, 0, 1)).toBeNull();
  });
});

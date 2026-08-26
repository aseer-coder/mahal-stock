import { describe, expect, it } from "vitest";

import { MAX_CART_PRODUCTS, addCartProduct, calculateCartTotal, calculateItemCount, nextCartQuantity, setCartProductQuantity } from "../lib/inventory/commerce";

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

  it("يدعم سلة تصل إلى 150 صنفًا ويمنع الصنف رقم 151", () => {
    const cart = Array.from({ length: MAX_CART_PRODUCTS }, (_, index) => ({ productId: `product-${index}`, quantity: 1 }));
    expect(addCartProduct(cart, "product-151", 2).reason).toBe("capacity");
    expect(addCartProduct(cart, "product-0", 2).lines[0].quantity).toBe(2);
  });

  it("يحدّث الكمية المكتوبة يدويًا أو يحذف السطر عند إدخال صفر", () => {
    const cart = [{ productId: "p1", quantity: 1 }];
    expect(setCartProductQuantity(cart, "p1", 7, 10).lines[0].quantity).toBe(7);
    expect(setCartProductQuantity(cart, "p1", 0, 10).reason).toBe("removed");
    expect(setCartProductQuantity(cart, "p1", 11, 10).reason).toBe("invalid");
  });
});

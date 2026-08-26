import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { addCartProduct, calculateItemCount, setCartProductQuantity, type CartLine, type CartUpdate } from "@/lib/inventory/commerce";
import { adjustProductQuantity as adjustQuantityInDatabase, createProduct as createProductInDatabase, createSale as createSaleInDatabase, deleteProduct as deleteProductInDatabase, getCategories, getProducts, getSales, initializeDatabase, loadSettings, saveSettings as saveSettingsInDatabase, updateProduct as updateProductInDatabase } from "@/lib/inventory/database";
import { defaultSettings, type Category, type Product, type ProductInput, type Sale, type SaleItemInput, type ShopSettings } from "@/lib/inventory/types";

type InventoryContextValue = { isReady: boolean; products: Product[]; categories: Category[]; sales: Sale[]; settings: ShopSettings; refresh: () => Promise<void>; createProduct: (input: ProductInput) => Promise<string>; updateProduct: (id: string, input: ProductInput) => Promise<void>; deleteProduct: (id: string) => Promise<void>; adjustQuantity: (id: string, quantity: number) => Promise<void>; createSale: (items: SaleItemInput[]) => Promise<string>; saveSettings: (settings: ShopSettings) => Promise<void> };
type SaleCartContextValue = { cart: CartLine[]; itemCount: number; addProductToCart: (productId: string) => CartUpdate; setCartQuantity: (productId: string, quantity: number) => CartUpdate; clearCart: () => void };

const InventoryContext = createContext<InventoryContextValue | null>(null);
const SaleCartContext = createContext<SaleCartContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false); const [products, setProducts] = useState<Product[]>([]); const [categories, setCategories] = useState<Category[]>([]); const [sales, setSales] = useState<Sale[]>([]); const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const refresh = useCallback(async () => { const [nextProducts, nextCategories, nextSales, nextSettings] = await Promise.all([getProducts(), getCategories(), getSales(), loadSettings()]); setProducts(nextProducts); setCategories(nextCategories); setSales(nextSales); setSettings(nextSettings); }, []);
  useEffect(() => { initializeDatabase().then(refresh).finally(() => setIsReady(true)); }, [refresh]);
  const runAndRefresh = useCallback(async <T,>(operation: () => Promise<T>) => { const result = await operation(); await refresh(); return result; }, [refresh]);
  const value = useMemo<InventoryContextValue>(() => ({ isReady, products, categories, sales, settings, refresh, createProduct: (input) => runAndRefresh(() => createProductInDatabase(input)), updateProduct: (id, input) => runAndRefresh(() => updateProductInDatabase(id, input)), deleteProduct: (id) => runAndRefresh(() => deleteProductInDatabase(id)), adjustQuantity: (id, quantity) => runAndRefresh(() => adjustQuantityInDatabase(id, quantity)), createSale: (items) => runAndRefresh(() => createSaleInDatabase(items)), saveSettings: (nextSettings) => runAndRefresh(async () => { await saveSettingsInDatabase(nextSettings); }) }), [isReady, products, categories, sales, settings, refresh, runAndRefresh]);
  return <InventoryContext.Provider value={value}><SaleCartProvider>{children}</SaleCartProvider></InventoryContext.Provider>;
}

function SaleCartProvider({ children }: { children: React.ReactNode }) {
  const { products } = useInventory(); const [cart, setCart] = useState<CartLine[]>([]);
  const addProductToCart = useCallback((productId: string) => { const product = products.find((item) => item.id === productId); if (!product) return { lines: cart, reason: "invalid" as const }; const result = addCartProduct(cart, productId, product.quantity); if (result.lines !== cart) setCart(result.lines); return result; }, [cart, products]);
  const setCartQuantity = useCallback((productId: string, quantity: number) => { const product = products.find((item) => item.id === productId); if (!product) return { lines: cart, reason: "invalid" as const }; const result = setCartProductQuantity(cart, productId, quantity, product.quantity); if (result.lines !== cart) setCart(result.lines); return result; }, [cart, products]);
  const value = useMemo<SaleCartContextValue>(() => ({ cart, itemCount: calculateItemCount(cart), addProductToCart, setCartQuantity, clearCart: () => setCart([]) }), [cart, addProductToCart, setCartQuantity]);
  return <SaleCartContext.Provider value={value}>{children}</SaleCartContext.Provider>;
}

export function useInventory() { const context = useContext(InventoryContext); if (!context) throw new Error("useInventory must be used within InventoryProvider"); return context; }
export function useSaleCart() { const context = useContext(SaleCartContext); if (!context) throw new Error("useSaleCart must be used within InventoryProvider"); return context; }

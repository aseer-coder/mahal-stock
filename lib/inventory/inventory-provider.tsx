import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { adjustProductQuantity as adjustQuantityInDatabase, createProduct as createProductInDatabase, createSale as createSaleInDatabase, deleteProduct as deleteProductInDatabase, getCategories, getProducts, getSales, initializeDatabase, loadSettings, saveSettings as saveSettingsInDatabase, updateProduct as updateProductInDatabase } from "@/lib/inventory/database";
import { defaultSettings, type Category, type Product, type ProductInput, type Sale, type SaleItemInput, type ShopSettings } from "@/lib/inventory/types";

type InventoryContextValue = { isReady: boolean; products: Product[]; categories: Category[]; sales: Sale[]; settings: ShopSettings; refresh: () => Promise<void>; createProduct: (input: ProductInput) => Promise<string>; updateProduct: (id: string, input: ProductInput) => Promise<void>; deleteProduct: (id: string) => Promise<void>; adjustQuantity: (id: string, quantity: number) => Promise<void>; createSale: (items: SaleItemInput[]) => Promise<string>; saveSettings: (settings: ShopSettings) => Promise<void> };
const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false); const [products, setProducts] = useState<Product[]>([]); const [categories, setCategories] = useState<Category[]>([]); const [sales, setSales] = useState<Sale[]>([]); const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const refresh = useCallback(async () => { const [nextProducts, nextCategories, nextSales, nextSettings] = await Promise.all([getProducts(), getCategories(), getSales(), loadSettings()]); setProducts(nextProducts); setCategories(nextCategories); setSales(nextSales); setSettings(nextSettings); }, []);
  useEffect(() => { initializeDatabase().then(refresh).finally(() => setIsReady(true)); }, [refresh]);
  const runAndRefresh = useCallback(async <T,>(operation: () => Promise<T>) => { const result = await operation(); await refresh(); return result; }, [refresh]);
  const value = useMemo<InventoryContextValue>(() => ({ isReady, products, categories, sales, settings, refresh, createProduct: (input) => runAndRefresh(() => createProductInDatabase(input)), updateProduct: (id, input) => runAndRefresh(() => updateProductInDatabase(id, input)), deleteProduct: (id) => runAndRefresh(() => deleteProductInDatabase(id)), adjustQuantity: (id, quantity) => runAndRefresh(() => adjustQuantityInDatabase(id, quantity)), createSale: (items) => runAndRefresh(() => createSaleInDatabase(items)), saveSettings: (nextSettings) => runAndRefresh(async () => { await saveSettingsInDatabase(nextSettings); }) }), [isReady, products, categories, sales, settings, refresh, runAndRefresh]);
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() { const context = useContext(InventoryContext); if (!context) throw new Error("useInventory must be used within InventoryProvider"); return context; }

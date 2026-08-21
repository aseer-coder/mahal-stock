export type Product = {
  id: string;
  name: string;
  barcode: string | null;
  imageUri: string | null;
  sellPrice: number;
  purchasePrice: number | null;
  quantity: number;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  name: string;
  barcode?: string | null;
  imageUri?: string | null;
  sellPrice: number;
  purchasePrice?: number | null;
  quantity: number;
  categoryName?: string | null;
  description?: string | null;
};

export type Category = { id: string; name: string; color: string; createdAt: string };
export type Sale = { id: string; total: number; itemCount: number; createdAt: string };
export type SaleItem = { id: string; saleId: string; productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number };
export type SaleItemInput = { productId: string; quantity: number };
export type ShopSettings = { shopName: string; currency: string; lowStockThreshold: number; colorScheme: "light" | "dark" };

export const defaultSettings: ShopSettings = { shopName: "متجري", currency: "ر.س", lowStockThreshold: 5, colorScheme: "light" };

export type BackupSnapshot = {
  app: "mahal-stock";
  version: 1;
  createdAt: string;
  products: Product[];
  categories: Category[];
  sales: Sale[];
  saleItems: SaleItem[];
  settings: ShopSettings;
};

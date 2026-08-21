import * as SQLite from "expo-sqlite";

import { calculateCartTotal, calculateItemCount } from "@/lib/inventory/commerce";
import { defaultSettings, type BackupSnapshot, type Category, type Product, type ProductInput, type Sale, type SaleItem, type SaleItemInput, type ShopSettings } from "@/lib/inventory/types";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
const now = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

type ProductRow = { id: string; name: string; barcode: string | null; image_uri: string | null; sell_price: number; purchase_price: number | null; quantity: number; category_id: string | null; category_name: string | null; description: string | null; created_at: string; updated_at: string };
const mapProduct = (row: ProductRow): Product => ({ id: row.id, name: row.name, barcode: row.barcode, imageUri: row.image_uri, sellPrice: Number(row.sell_price), purchasePrice: row.purchase_price == null ? null : Number(row.purchase_price), quantity: Number(row.quantity), categoryId: row.category_id, categoryName: row.category_name, description: row.description, createdAt: row.created_at, updatedAt: row.updated_at });

export async function getDatabase() {
  if (!databasePromise) databasePromise = SQLite.openDatabaseAsync("mahal-stock.db");
  return databasePromise;
}

export async function initializeDatabase() {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL UNIQUE, color TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, barcode TEXT UNIQUE, image_uri TEXT, sell_price REAL NOT NULL, purchase_price REAL, quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0), category_id TEXT, description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL);
    CREATE TABLE IF NOT EXISTS sales (id TEXT PRIMARY KEY NOT NULL, total REAL NOT NULL, item_count INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sale_items (id TEXT PRIMARY KEY NOT NULL, sale_id TEXT NOT NULL, product_id TEXT NOT NULL, product_name TEXT NOT NULL, unit_price REAL NOT NULL, quantity INTEGER NOT NULL, subtotal REAL NOT NULL, FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE, FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE RESTRICT);
    CREATE TABLE IF NOT EXISTS app_settings (setting_key TEXT PRIMARY KEY NOT NULL, setting_value TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
  `);
}

export async function getProducts(): Promise<Product[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ProductRow>("SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.updated_at DESC, p.name COLLATE NOCASE ASC");
  return rows.map(mapProduct);
}

export async function findProductByBarcode(barcode: string): Promise<Product | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ProductRow>("SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.barcode = ?", [barcode.trim()]);
  return row ? mapProduct(row) : null;
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; name: string; color: string; created_at: string }>("SELECT * FROM categories ORDER BY name COLLATE NOCASE ASC");
  return rows.map((row) => ({ id: row.id, name: row.name, color: row.color, createdAt: row.created_at }));
}

async function resolveCategoryId(categoryName?: string | null) {
  const normalized = categoryName?.trim();
  if (!normalized) return null;
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>("SELECT id FROM categories WHERE name = ?", [normalized]);
  if (existing) return existing.id;
  const id = createId("cat");
  await db.runAsync("INSERT INTO categories (id, name, color, created_at) VALUES (?, ?, ?, ?)", [id, normalized, "#146C5A", now()]);
  return id;
}

function cleanInput(input: ProductInput) {
  const name = input.name.trim(); const barcode = input.barcode?.trim() || null;
  if (!name) throw new Error("أدخل اسم المنتج.");
  if (!Number.isFinite(input.sellPrice) || input.sellPrice < 0) throw new Error("أدخل سعر بيع صحيحًا.");
  if (!Number.isInteger(input.quantity) || input.quantity < 0) throw new Error("أدخل كمية صحيحة لا تقل عن صفر.");
  return { ...input, name, barcode, description: input.description?.trim() || null };
}

export async function createProduct(input: ProductInput) {
  const clean = cleanInput(input); const db = await getDatabase(); const id = createId("prd"); const timestamp = now(); const categoryId = await resolveCategoryId(clean.categoryName);
  try { await db.runAsync("INSERT INTO products (id, name, barcode, image_uri, sell_price, purchase_price, quantity, category_id, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, clean.name, clean.barcode, clean.imageUri ?? null, clean.sellPrice, clean.purchasePrice ?? null, clean.quantity, categoryId, clean.description, timestamp, timestamp]); }
  catch (error) { if (String(error).toLowerCase().includes("unique")) throw new Error("هذا الباركود مسجل لمنتج آخر."); throw error; }
  return id;
}

export async function updateProduct(id: string, input: ProductInput) {
  const clean = cleanInput(input); const db = await getDatabase(); const categoryId = await resolveCategoryId(clean.categoryName);
  try { const result = await db.runAsync("UPDATE products SET name = ?, barcode = ?, image_uri = ?, sell_price = ?, purchase_price = ?, quantity = ?, category_id = ?, description = ?, updated_at = ? WHERE id = ?", [clean.name, clean.barcode, clean.imageUri ?? null, clean.sellPrice, clean.purchasePrice ?? null, clean.quantity, categoryId, clean.description, now(), id]); if (!result.changes) throw new Error("تعذر العثور على المنتج."); }
  catch (error) { if (String(error).toLowerCase().includes("unique")) throw new Error("هذا الباركود مسجل لمنتج آخر."); throw error; }
}

export async function deleteProduct(id: string) {
  const db = await getDatabase();
  try { await db.runAsync("DELETE FROM products WHERE id = ?", [id]); }
  catch (error) { if (String(error).toLowerCase().includes("foreign")) throw new Error("لا يمكن حذف منتج لديه مبيعات مسجلة حفاظًا على سلامة السجل."); throw error; }
}

export async function adjustProductQuantity(id: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error("الكمية يجب أن تكون عددًا صحيحًا لا يقل عن صفر.");
  const db = await getDatabase(); await db.runAsync("UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?", [quantity, now(), id]);
}

export async function getSales(): Promise<Sale[]> {
  const db = await getDatabase(); const rows = await db.getAllAsync<{ id: string; total: number; item_count: number; created_at: string }>("SELECT * FROM sales ORDER BY created_at DESC");
  return rows.map((row) => ({ id: row.id, total: Number(row.total), itemCount: Number(row.item_count), createdAt: row.created_at }));
}

export async function getSaleItems(): Promise<SaleItem[]> {
  const db = await getDatabase(); const rows = await db.getAllAsync<{ id: string; sale_id: string; product_id: string; product_name: string; unit_price: number; quantity: number; subtotal: number }>("SELECT * FROM sale_items");
  return rows.map((row) => ({ id: row.id, saleId: row.sale_id, productId: row.product_id, productName: row.product_name, unitPrice: Number(row.unit_price), quantity: Number(row.quantity), subtotal: Number(row.subtotal) }));
}

export async function createSale(items: SaleItemInput[]) {
  if (!items.length) throw new Error("أضف منتجًا واحدًا على الأقل إلى السلة.");
  const db = await getDatabase(); const saleId = createId("sale"); const timestamp = now();
  await db.withExclusiveTransactionAsync(async (tx) => {
    const validated: Array<{ product: ProductRow; quantity: number }> = [];
    for (const item of items) { const product = await tx.getFirstAsync<ProductRow>("SELECT p.*, NULL AS category_name FROM products p WHERE id = ?", [item.productId]); if (!product) throw new Error("أحد منتجات السلة لم يعد موجودًا."); if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error("كمية البيع غير صالحة."); if (Number(product.quantity) < item.quantity) throw new Error(`الكمية المتوفرة من «${product.name}» غير كافية.`); validated.push({ product, quantity: item.quantity }); }
    const total = calculateCartTotal(validated.map((item) => ({ unitPrice: Number(item.product.sell_price), quantity: item.quantity }))); const itemCount = calculateItemCount(validated);
    await tx.runAsync("INSERT INTO sales (id, total, item_count, created_at) VALUES (?, ?, ?, ?)", [saleId, total, itemCount, timestamp]);
    for (const item of validated) { const subtotal = Number(item.product.sell_price) * item.quantity; await tx.runAsync("INSERT INTO sale_items (id, sale_id, product_id, product_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)", [createId("item"), saleId, item.product.id, item.product.name, Number(item.product.sell_price), item.quantity, subtotal]); await tx.runAsync("UPDATE products SET quantity = quantity - ?, updated_at = ? WHERE id = ?", [item.quantity, timestamp, item.product.id]); }
  });
  return saleId;
}

export async function loadSettings(): Promise<ShopSettings> {
  const db = await getDatabase(); const rows = await db.getAllAsync<{ setting_key: string; setting_value: string }>("SELECT * FROM app_settings"); const values = Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
  return { shopName: values.shopName || defaultSettings.shopName, currency: values.currency || defaultSettings.currency, lowStockThreshold: Number(values.lowStockThreshold ?? defaultSettings.lowStockThreshold), colorScheme: values.colorScheme === "dark" ? "dark" : "light" };
}

export async function saveSettings(settings: ShopSettings) {
  const db = await getDatabase(); const entries = Object.entries(settings).map(([key, value]) => [key, String(value)]);
  await db.withTransactionAsync(async () => { for (const [key, value] of entries) await db.runAsync("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value", [key, value]); });
}

export async function exportSnapshot(): Promise<BackupSnapshot> {
  const [products, categories, sales, saleItems, settings] = await Promise.all([getProducts(), getCategories(), getSales(), getSaleItems(), loadSettings()]); return { app: "mahal-stock", version: 1, createdAt: now(), products, categories, sales, saleItems, settings };
}

export async function restoreSnapshot(snapshot: BackupSnapshot) {
  if (snapshot.app !== "mahal-stock" || snapshot.version !== 1 || !Array.isArray(snapshot.products) || !Array.isArray(snapshot.sales)) throw new Error("ملف النسخة الاحتياطية غير صالح أو غير مدعوم.");
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync("DELETE FROM sale_items; DELETE FROM sales; DELETE FROM products; DELETE FROM categories; DELETE FROM app_settings;");
    for (const category of snapshot.categories) await db.runAsync("INSERT INTO categories (id, name, color, created_at) VALUES (?, ?, ?, ?)", [category.id, category.name, category.color, category.createdAt]);
    for (const product of snapshot.products) await db.runAsync("INSERT INTO products (id, name, barcode, image_uri, sell_price, purchase_price, quantity, category_id, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [product.id, product.name, product.barcode, product.imageUri, product.sellPrice, product.purchasePrice, product.quantity, product.categoryId, product.description, product.createdAt, product.updatedAt]);
    for (const sale of snapshot.sales) await db.runAsync("INSERT INTO sales (id, total, item_count, created_at) VALUES (?, ?, ?, ?)", [sale.id, sale.total, sale.itemCount, sale.createdAt]);
    for (const item of snapshot.saleItems) await db.runAsync("INSERT INTO sale_items (id, sale_id, product_id, product_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)", [item.id, item.saleId, item.productId, item.productName, item.unitPrice, item.quantity, item.subtotal]);
    for (const [key, value] of Object.entries(snapshot.settings)) await db.runAsync("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)", [key, String(value)]);
  });
}

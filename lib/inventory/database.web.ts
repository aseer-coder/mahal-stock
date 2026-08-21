import AsyncStorage from "@react-native-async-storage/async-storage";

import { calculateCartTotal, calculateItemCount } from "@/lib/inventory/commerce";
import { defaultSettings, type BackupSnapshot, type Category, type Product, type ProductInput, type Sale, type SaleItem, type SaleItemInput, type ShopSettings } from "@/lib/inventory/types";

type Store = { products: Product[]; categories: Category[]; sales: Sale[]; saleItems: SaleItem[]; settings: ShopSettings };
const storageKey = "mahal-stock-web-preview";
const emptyStore = (): Store => ({ products: [], categories: [], sales: [], saleItems: [], settings: defaultSettings });
let store = emptyStore();
let isLoaded = false;
const now = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

async function load() {
  if (isLoaded) return;
  const raw = await AsyncStorage.getItem(storageKey);
  if (raw) { try { const parsed = JSON.parse(raw) as Partial<Store>; store = { ...emptyStore(), ...parsed, settings: { ...defaultSettings, ...parsed.settings } }; } catch { store = emptyStore(); } }
  isLoaded = true;
}
async function persist() { await AsyncStorage.setItem(storageKey, JSON.stringify(store)); }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
async function resolveCategoryId(categoryName?: string | null) { const name = categoryName?.trim(); if (!name) return null; let category = store.categories.find((entry) => entry.name === name); if (!category) { category = { id: createId("cat"), name, color: "#146C5A", createdAt: now() }; store.categories.push(category); } return category.id; }
function validate(input: ProductInput) { const name = input.name.trim(); const barcode = input.barcode?.trim() || null; if (!name) throw new Error("أدخل اسم المنتج."); if (!Number.isFinite(input.sellPrice) || input.sellPrice < 0) throw new Error("أدخل سعر بيع صحيحًا."); if (!Number.isInteger(input.quantity) || input.quantity < 0) throw new Error("أدخل كمية صحيحة لا تقل عن صفر."); return { ...input, name, barcode, description: input.description?.trim() || null }; }

export async function initializeDatabase() { await load(); }
export async function getProducts() { await load(); return clone(store.products).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name)); }
export async function findProductByBarcode(barcode: string) { await load(); const product = store.products.find((entry) => entry.barcode === barcode.trim()); return product ? clone(product) : null; }
export async function getCategories() { await load(); return clone(store.categories).sort((a, b) => a.name.localeCompare(b.name)); }
export async function createProduct(input: ProductInput) { await load(); const clean = validate(input); if (clean.barcode && store.products.some((product) => product.barcode === clean.barcode)) throw new Error("هذا الباركود مسجل لمنتج آخر."); const id = createId("prd"); const resolvedCategoryId = await resolveCategoryId(clean.categoryName); const timestamp = now(); const category = store.categories.find((entry) => entry.id === resolvedCategoryId); store.products.push({ id, name: clean.name, barcode: clean.barcode, imageUri: clean.imageUri ?? null, sellPrice: clean.sellPrice, purchasePrice: clean.purchasePrice ?? null, quantity: clean.quantity, categoryId: resolvedCategoryId, categoryName: category?.name ?? null, description: clean.description, createdAt: timestamp, updatedAt: timestamp }); await persist(); return id; }
export async function updateProduct(id: string, input: ProductInput) { await load(); const clean = validate(input); const index = store.products.findIndex((product) => product.id === id); if (index < 0) throw new Error("تعذر العثور على المنتج."); if (clean.barcode && store.products.some((product) => product.id !== id && product.barcode === clean.barcode)) throw new Error("هذا الباركود مسجل لمنتج آخر."); const resolvedCategoryId = await resolveCategoryId(clean.categoryName); const category = store.categories.find((entry) => entry.id === resolvedCategoryId); store.products[index] = { ...store.products[index], name: clean.name, barcode: clean.barcode, imageUri: clean.imageUri ?? null, sellPrice: clean.sellPrice, purchasePrice: clean.purchasePrice ?? null, quantity: clean.quantity, categoryId: resolvedCategoryId, categoryName: category?.name ?? null, description: clean.description, updatedAt: now() }; await persist(); }
export async function deleteProduct(id: string) { await load(); if (store.saleItems.some((item) => item.productId === id)) throw new Error("لا يمكن حذف منتج لديه مبيعات مسجلة حفاظًا على سلامة السجل."); store.products = store.products.filter((product) => product.id !== id); await persist(); }
export async function adjustProductQuantity(id: string, quantity: number) { await load(); if (!Number.isInteger(quantity) || quantity < 0) throw new Error("الكمية يجب أن تكون عددًا صحيحًا لا يقل عن صفر."); const product = store.products.find((entry) => entry.id === id); if (!product) throw new Error("تعذر العثور على المنتج."); product.quantity = quantity; product.updatedAt = now(); await persist(); }
export async function getSales() { await load(); return clone(store.sales).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export async function getSaleItems() { await load(); return clone(store.saleItems); }
export async function createSale(items: SaleItemInput[]) { await load(); if (!items.length) throw new Error("أضف منتجًا واحدًا على الأقل إلى السلة."); const resolved = items.map((item) => ({ product: store.products.find((product) => product.id === item.productId), quantity: item.quantity })); for (const item of resolved) { if (!item.product) throw new Error("أحد منتجات السلة لم يعد موجودًا."); if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > item.product.quantity) throw new Error(`الكمية المتوفرة من «${item.product.name}» غير كافية.`); }
  const valid = resolved as Array<{ product: Product; quantity: number }>; const saleId = createId("sale"); const createdAt = now(); const total = calculateCartTotal(valid.map((item) => ({ unitPrice: item.product.sellPrice, quantity: item.quantity }))); const itemCount = calculateItemCount(valid); store.sales.unshift({ id: saleId, total, itemCount, createdAt }); for (const item of valid) { const subtotal = item.product.sellPrice * item.quantity; store.saleItems.push({ id: createId("item"), saleId, productId: item.product.id, productName: item.product.name, unitPrice: item.product.sellPrice, quantity: item.quantity, subtotal }); item.product.quantity -= item.quantity; item.product.updatedAt = createdAt; } await persist(); return saleId; }
export async function loadSettings() { await load(); return clone(store.settings); }
export async function saveSettings(settings: ShopSettings) { await load(); store.settings = clone(settings); await persist(); }
export async function exportSnapshot(): Promise<BackupSnapshot> { await load(); return { app: "mahal-stock", version: 1, createdAt: now(), products: clone(store.products), categories: clone(store.categories), sales: clone(store.sales), saleItems: clone(store.saleItems), settings: clone(store.settings) }; }
export async function restoreSnapshot(snapshot: BackupSnapshot) { if (snapshot.app !== "mahal-stock" || snapshot.version !== 1 || !Array.isArray(snapshot.products) || !Array.isArray(snapshot.sales)) throw new Error("ملف النسخة الاحتياطية غير صالح أو غير مدعوم."); store = { products: clone(snapshot.products), categories: clone(snapshot.categories), sales: clone(snapshot.sales), saleItems: clone(snapshot.saleItems), settings: clone(snapshot.settings) }; isLoaded = true; await persist(); }

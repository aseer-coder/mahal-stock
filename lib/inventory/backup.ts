import * as FileSystem from "expo-file-system/legacy";
import { exportSnapshot, restoreSnapshot } from "@/lib/inventory/database";
import type { BackupSnapshot } from "@/lib/inventory/types";

const backupDirectory = `${FileSystem.documentDirectory}mahal-stock/backups/`;
export async function createBackupFile() { const snapshot = await exportSnapshot(); await FileSystem.makeDirectoryAsync(backupDirectory, { intermediates: true }); const uri = `${backupDirectory}mahal-stock-backup-${new Date().toISOString().slice(0, 10)}.json`; await FileSystem.writeAsStringAsync(uri, JSON.stringify(snapshot), { encoding: FileSystem.EncodingType.UTF8 }); return uri; }
export async function restoreBackupFile(uri: string) { const raw = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 }); await restoreSnapshot(JSON.parse(raw) as BackupSnapshot); }
export async function persistProductImage(sourceUri: string) { if (sourceUri.startsWith("data:") || sourceUri.startsWith("http")) return sourceUri; const directory = `${FileSystem.documentDirectory}mahal-stock/products/`; await FileSystem.makeDirectoryAsync(directory, { intermediates: true }); const extension = sourceUri.split("?")[0].split(".").pop() || "jpg"; const destination = `${directory}product-${Date.now()}.${extension}`; await FileSystem.copyAsync({ from: sourceUri, to: destination }); return destination; }

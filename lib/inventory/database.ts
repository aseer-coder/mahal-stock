// TypeScript resolves this bridge during static checking. Metro selects database.web.ts
// for browser preview and database.native.ts for Android at runtime.
export * from "./database.web";


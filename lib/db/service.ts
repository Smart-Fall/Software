/**
 * Database Service
 * Factory and singleton for the database adapter
 * Provides a single interface to the Convex backend
 */

import { IDatabaseAdapter } from "./adapters/base";

let adapterInstance: IDatabaseAdapter | null = null;
let initializationPromise: Promise<IDatabaseAdapter> | null = null;

/**
 * Get or create the database adapter singleton (async version)
 * Lazily loads the Convex adapter
 */
export async function getDatabaseAdapter(): Promise<IDatabaseAdapter> {
  if (adapterInstance) {
    return adapterInstance;
  }

  // Prevent multiple concurrent initialization attempts
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = initializeAdapter();
  adapterInstance = await initializationPromise;
  initializationPromise = null;

  return adapterInstance;
}

/**
 * Initialize the Convex adapter
 */
async function initializeAdapter(): Promise<IDatabaseAdapter> {
  const { ConvexAdapter } = await import("./adapters/convex");
  return new ConvexAdapter();
}

/**
 * Reset adapter instance (useful for testing)
 */
export function resetDatabaseAdapter(): void {
  adapterInstance = null;
  initializationPromise = null;
}

// ============================================================================
// Synchronous access (for use in middleware and components)
// ============================================================================

let syncAdapterInstance: IDatabaseAdapter | null = null;

/**
 * Initialize the sync adapter during app startup
 * Call this once in your app's root layout or initialization
 */
export async function initializeDatabase(): Promise<void> {
  syncAdapterInstance = await getDatabaseAdapter();
}

/**
 * Get the database adapter, initializing it if needed.
 * Prefer this in API route handlers and other async server code.
 */
export async function getDbServiceAsync(): Promise<IDatabaseAdapter> {
  if (syncAdapterInstance) {
    return syncAdapterInstance;
  }

  syncAdapterInstance = await getDatabaseAdapter();
  return syncAdapterInstance;
}

/**
 * Get the initialized database adapter
 * Must call initializeDatabase() first
 */
export function getDbService(): IDatabaseAdapter {
  if (!syncAdapterInstance) {
    throw new Error(
      "Database service not initialized. Call initializeDatabase() during app startup.",
    );
  }
  return syncAdapterInstance;
}

// ============================================================================
// Type Exports
// ============================================================================

export type { IDatabaseAdapter } from "./adapters/base";
export * from "./types";
export * from "./config";

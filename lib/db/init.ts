/**
 * Database Initialization
 * Call this function once during app startup to initialize the database service
 */

import { initializeDatabase } from './service';

let initialized = false;

/**
 * Initialize the database adapter singleton
 * Safe to call multiple times - only initializes once
 */
export async function initDb(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    await initializeDatabase();
    initialized = true;
    console.log('✅ Database service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database service:', error);
    throw error;
  }
}

/**
 * Database Configuration
 * Loads and validates the Convex environment variables
 */

export interface DatabaseConfig {
  convex: {
    deploymentUrl: string;
    publicUrl: string;
  };
}

/**
 * Load and validate database configuration from environment variables
 */
export function loadDatabaseConfig(): DatabaseConfig {
  const deploymentUrl = process.env.CONVEX_DEPLOYMENT;
  const publicUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!deploymentUrl) {
    throw new Error('CONVEX_DEPLOYMENT environment variable is required');
  }
  if (!publicUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
  }

  return { convex: { deploymentUrl, publicUrl } };
}

/**
 * Cached configuration instance
 * Validate on first access
 */
let cachedConfig: DatabaseConfig | null = null;

export function getDatabaseConfig(): DatabaseConfig {
  if (!cachedConfig) {
    cachedConfig = loadDatabaseConfig();
  }
  return cachedConfig;
}

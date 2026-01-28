/**
 * Database Configuration
 * Centralizes environment-based database provider selection and validation
 */

export type DatabaseProvider = 'prisma' | 'convex';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  prisma?: {
    databaseUrl: string;
  };
  convex?: {
    deploymentUrl: string;
    publicUrl: string;
  };
}

/**
 * Load and validate database configuration from environment variables
 */
export function loadDatabaseConfig(): DatabaseConfig {
  const provider = (process.env.DATABASE_PROVIDER || 'prisma') as DatabaseProvider;

  if (!['prisma', 'convex'].includes(provider)) {
    throw new Error(
      `Invalid DATABASE_PROVIDER: "${provider}". Must be "prisma" or "convex"`
    );
  }

  const config: DatabaseConfig = {
    provider,
  };

  // Validate provider-specific configuration
  if (provider === 'prisma') {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for prisma provider');
    }
    config.prisma = { databaseUrl };
  }

  if (provider === 'convex') {
    const deploymentUrl = process.env.CONVEX_DEPLOYMENT;
    const publicUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!deploymentUrl) {
      throw new Error('CONVEX_DEPLOYMENT environment variable is required for convex provider');
    }
    if (!publicUrl) {
      throw new Error(
        'NEXT_PUBLIC_CONVEX_URL environment variable is required for convex provider'
      );
    }

    config.convex = { deploymentUrl, publicUrl };
  }

  return config;
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

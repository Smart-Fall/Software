/**
 * Convex HTTP Client Setup
 * Initializes the Convex client for API communication
 */

import { ConvexHttpClient } from 'convex/browser';
import { getDatabaseConfig } from '../../config';

let clientInstance: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!clientInstance) {
    const config = getDatabaseConfig();
    clientInstance = new ConvexHttpClient(config.convex.publicUrl);
  }

  return clientInstance;
}

export function resetConvexClient(): void {
  clientInstance = null;
}

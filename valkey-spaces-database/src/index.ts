/**
 * Valkey Spaces Database
 * 
 * Main entry point for the application.
 * This file exports all public APIs and provides a programmatic interface.
 */

// Configuration
export { env, logger } from './config/index.js';

// Data models
export * from './models/index.js';

// Database operations
export * from './database/index.js';

// Utilities
export * from './utils/keys.js';

// CLI types (for programmatic usage)
export * from './cli/types.js';
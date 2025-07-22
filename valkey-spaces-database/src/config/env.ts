import { config } from '@dotenvx/dotenvx';
import { z } from 'zod';

// Load environment variables with dotenvx
config();

// Environment variable schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Valkey Configuration
  VALKEY_HOST: z.string().default('localhost'),
  VALKEY_PORT: z.coerce.number().default(6379),
  VALKEY_PASSWORD: z.string().optional(),
  
  // Digital Ocean Spaces
  DO_SPACES_KEY: z.string(),
  DO_SPACES_SECRET: z.string(),
  DO_SPACES_ENDPOINT: z.string(),
  DO_SPACES_BUCKET: z.string(),
  
  // Retry Configuration
  RETRY_MAX_ATTEMPTS: z.coerce.number().default(3),
  RETRY_BASE_DELAY: z.coerce.number().default(1000),
  RETRY_MAX_DELAY: z.coerce.number().default(8000),
  
  // TxKey Configuration
  TXKEY_EXECUTABLE_PATH: z.string().default('/usr/local/bin/txkey'),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Validate and export environment configuration
export const env: EnvConfig = envSchema.parse(process.env);
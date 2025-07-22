import { exec, ExecException } from 'child_process';
import { promisify } from 'util';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// Promisify exec for easier async/await usage
const execPromise = promisify(exec);

// Get txkey executable path from environment or use default
const getTxKeyPath = (): string => {
  return process.env.TXKEY_EXECUTABLE_PATH || '/usr/local/bin/txkey';
};

/**
 * Generates a 12-character time-based short key by invoking external 'txkey' executable.
 * 
 * @param args Optional array of arguments to pass to txkey
 * @returns Promise resolving to 12-character txkey string
 * @throws Error if executable fails or returns no output
 */
export async function createTxKey(args: string[] = []): Promise<string> {
  const txkeyPath = getTxKeyPath();
  const command = `${txkeyPath} ${args.map(arg => `'${arg}'`).join(' ')}`;

  try {
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      logger.warn('txkey executable produced stderr', { 
        stderr: stderr.trim(),
        command 
      });
    }

    const key = stdout.trim();

    if (!key) {
      throw new Error('txkey executable returned no output');
    }

    logger.debug('Generated txkey', { key, args });
    return key;

  } catch (error: any) {
    const execError = error as ExecException;
    logger.error('Failed to generate txkey', {
      message: execError.message,
      code: execError.code,
      signal: execError.signal,
      stderr: execError.stderr?.trim(),
      command
    });

    throw new Error(`Failed to generate key using txkey executable: ${execError.message}`);
  }
}

/**
 * Generates a 16-character route key in domain:txkey format.
 * 
 * @param domain Three character domain prefix (e.g., 'usr', 'con')
 * @returns Promise resolving to 16-character route key string
 */
export async function createRouteKey(domain: string): Promise<string> {
  if (domain.length !== 3) {
    throw new Error('Domain must be exactly 3 characters');
  }

  const txKey = await createTxKey();
  const routeKey = `${domain}:${txKey}`;
  
  logger.debug('Generated route key', { domain, txKey, routeKey });
  return routeKey;
}

/**
 * Validates that a key matches the expected route key format (domain:txkey).
 * 
 * @param key The key to validate
 * @returns True if key is valid route key format
 */
export function isValidRouteKey(key: string): boolean {
  return /^[a-z]{3}:[a-zA-Z0-9]{12}$/.test(key);
}

/**
 * Extracts the domain from a route key.
 * 
 * @param key Route key in domain:txkey format
 * @returns Domain portion of the key
 * @throws Error if key is invalid format
 */
export function extractDomain(key: string): string {
  if (!isValidRouteKey(key)) {
    throw new Error('Invalid route key format');
  }
  return key.split(':')[0];
}

/**
 * Extracts the txkey from a route key.
 * 
 * @param key Route key in domain:txkey format  
 * @returns Txkey portion of the key
 * @throws Error if key is invalid format
 */
export function extractTxKey(key: string): string {
  if (!isValidRouteKey(key)) {
    throw new Error('Invalid route key format');
  }
  return key.split(':')[1];
}
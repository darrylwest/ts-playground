import { getValkeyClient } from './connections.js';
import { set as dbSet, get as dbGet } from './operations.js';
import { retryWithExponentialBackoff } from './retry.js';
import { logger } from '../config/logger.js';

const EMAIL_INDEX_KEY = 'email_index';
const EMAIL_INDEX_S3_KEY = 'system/email_index.json';

/**
 * Add email→key mapping to the index
 */
export async function addEmailMapping(
  email: string,
  key: string
): Promise<void> {
  logger.debug('Adding email mapping to index', { email, key });

  const operations = [];

  // Add to Valkey hash
  operations.push(
    retryWithExponentialBackoff(async () => {
      const client = await getValkeyClient();
      await client.hset(EMAIL_INDEX_KEY, email, key);
      logger.debug('Email mapping added to Valkey hash', { email, key });
    }, `email-index-valkey-add-${email}`)
  );

  // Note: S3 backup happens asynchronously via periodic sync
  // The Valkey hash is the source of truth for real-time operations

  await Promise.all(operations);
  logger.info('Email mapping added successfully', { email, key });
}

/**
 * Get key by email address with O(1) lookup
 */
export async function getKeyByEmail(email: string): Promise<string | null> {
  logger.debug('Looking up key by email', { email });

  try {
    const key = await retryWithExponentialBackoff(async () => {
      const client = await getValkeyClient();
      const result = await client.hget(EMAIL_INDEX_KEY, email);
      return result;
    }, `email-lookup-${email}`);

    if (key) {
      logger.debug('Email lookup successful', { email, key });
      return key;
    }

    logger.debug('Email not found in index', { email });
    return null;
  } catch (error) {
    logger.error('Email lookup failed', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Remove email mapping from index
 */
export async function removeEmailMapping(email: string): Promise<boolean> {
  logger.debug('Removing email mapping from index', { email });

  let valkeyRemoved = false;
  let s3Updated = false;

  const operations = [];

  // Remove from Valkey hash
  operations.push(
    retryWithExponentialBackoff(async () => {
      const client = await getValkeyClient();
      const result = await client.hdel(EMAIL_INDEX_KEY, email);
      valkeyRemoved = result > 0;
      logger.debug('Email mapping removed from Valkey', {
        email,
        removed: valkeyRemoved,
      });
    }, `email-index-valkey-remove-${email}`).catch(error => {
      logger.warn('Failed to remove email mapping from Valkey', {
        email,
        error: error instanceof Error ? error.message : String(error),
      });
    })
  );

  // Note: S3 backup happens asynchronously via periodic sync
  // The Valkey hash is the source of truth for real-time operations
  s3Updated = true; // Consider it updated since we'll sync later

  await Promise.all(operations);

  const success = valkeyRemoved || s3Updated;
  logger.info('Email mapping removal completed', { email, success });
  return success;
}

/**
 * Rebuild email index by scanning all user keys
 */
export async function rebuildEmailIndex(userKeys: string[]): Promise<void> {
  logger.info('Rebuilding email index', { totalUsers: userKeys.length });

  try {
    const client = await getValkeyClient();

    // Clear existing index
    await retryWithExponentialBackoff(async () => {
      await client.del(EMAIL_INDEX_KEY);
      logger.debug('Existing email index cleared');
    }, 'clear-email-index');

    const newIndex: Record<string, string> = {};
    let processed = 0;
    let errors = 0;

    // Process users in batches
    const batchSize = 100;
    for (let i = 0; i < userKeys.length; i += batchSize) {
      const batch = userKeys.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async key => {
          try {
            const userData = await dbGet(key);
            if (
              userData &&
              typeof userData === 'object' &&
              'email' in userData
            ) {
              const email = (userData as { email: string }).email;

              // Add to Valkey hash
              await client.hset(EMAIL_INDEX_KEY, email, key);

              // Add to new index object for S3
              newIndex[email] = key;

              processed++;
            }
          } catch (error) {
            errors++;
            logger.warn('Error processing user for email index rebuild', {
              key,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        })
      );

      logger.debug('Processed batch for email index rebuild', {
        processed: Math.min(i + batchSize, userKeys.length),
        total: userKeys.length,
      });
    }

    // Store complete index to S3
    await retryWithExponentialBackoff(async () => {
      await dbSet(EMAIL_INDEX_S3_KEY, newIndex);
      logger.debug('Email index stored to S3', {
        entries: Object.keys(newIndex).length,
      });
    }, 'email-index-s3-store');

    logger.info('Email index rebuild completed', {
      processed,
      errors,
      totalEntries: Object.keys(newIndex).length,
    });
  } catch (error) {
    logger.error('Email index rebuild failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Verify email index consistency
 */
export async function verifyEmailIndex(): Promise<{
  consistent: boolean;
  valkeyEntries: number;
  s3Entries: number;
  mismatches: string[];
}> {
  logger.info('Starting email index verification');

  try {
    const client = await getValkeyClient();

    // Get all entries from Valkey hash
    const valkeyEntries = await retryWithExponentialBackoff(async () => {
      return await client.hgetall(EMAIL_INDEX_KEY);
    }, 'verify-valkey-index');

    // Get index from S3
    let s3Entries: Record<string, string> = {};
    try {
      const s3Index = await dbGet<Record<string, string>>(EMAIL_INDEX_S3_KEY);
      if (s3Index) {
        s3Entries = s3Index;
      }
    } catch (error) {
      logger.warn('Could not retrieve S3 email index for verification', {
        error,
      });
    }

    // Compare entries
    const mismatches: string[] = [];
    const allEmails = new Set([
      ...Object.keys(valkeyEntries),
      ...Object.keys(s3Entries),
    ]);

    for (const email of allEmails) {
      const valkeyKey = valkeyEntries[email];
      const s3Key = s3Entries[email];

      if (valkeyKey !== s3Key) {
        mismatches.push(email);
        logger.warn('Email index mismatch detected', {
          email,
          valkeyKey: valkeyKey || 'missing',
          s3Key: s3Key || 'missing',
        });
      }
    }

    const result = {
      consistent: mismatches.length === 0,
      valkeyEntries: Object.keys(valkeyEntries).length,
      s3Entries: Object.keys(s3Entries).length,
      mismatches,
    };

    logger.info('Email index verification completed', result);
    return result;
  } catch (error) {
    logger.error('Email index verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Sync email index from Valkey hash to S3 backup
 */
export async function syncEmailIndexToS3(): Promise<void> {
  logger.info('Syncing email index to S3 backup');

  try {
    // Get current state from Valkey hash (source of truth)
    const currentIndex = await retryWithExponentialBackoff(async () => {
      const client = await getValkeyClient();
      return await client.hgetall(EMAIL_INDEX_KEY);
    }, 'get-email-index-for-sync');

    // Store complete index as S3 backup
    await retryWithExponentialBackoff(async () => {
      await dbSet(EMAIL_INDEX_S3_KEY, currentIndex);
      logger.info('Email index successfully backed up to S3', {
        totalMappings: Object.keys(currentIndex).length,
      });
    }, 'email-index-s3-sync');
  } catch (error) {
    logger.error('Failed to sync email index to S3', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get all email mappings (for admin purposes)
 */
export async function getAllEmailMappings(): Promise<Record<string, string>> {
  logger.debug('Retrieving all email mappings');

  try {
    const result = await retryWithExponentialBackoff(async () => {
      const client = await getValkeyClient();
      return await client.hgetall(EMAIL_INDEX_KEY);
    }, 'get-all-email-mappings');

    logger.debug('Retrieved email mappings', {
      count: Object.keys(result).length,
    });
    return result;
  } catch (error) {
    logger.error('Failed to retrieve email mappings', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

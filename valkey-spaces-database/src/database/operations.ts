import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getValkeyClient, getS3Client } from './connections.js';
import { retryWithExponentialBackoff } from './retry.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Set operation: Dual-write to Valkey and S3 with retry logic
 */
export async function set(key: string, data: object): Promise<void> {
  const serializedData = JSON.stringify(data);

  logger.debug('Starting dual-write operation', { key });

  // Parallel writes with individual retry logic
  const valkeyOperation = retryWithExponentialBackoff(async () => {
    const client = await getValkeyClient();
    await client.set(key, serializedData);
    logger.debug('Valkey write successful', { key });
  }, `valkey-set-${key}`);

  const s3Operation = retryWithExponentialBackoff(async () => {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: env.DO_SPACES_BUCKET,
        Key: key,
        Body: serializedData,
        ContentType: 'application/json',
      })
    );
    logger.debug('S3 write successful', { key });
  }, `s3-set-${key}`);

  // Execute both operations in parallel
  try {
    await Promise.all([valkeyOperation, s3Operation]);
    logger.info('Dual-write completed successfully', { key });
  } catch (error) {
    logger.error('Dual-write operation failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * S3-only set operation: Write directly to S3 without cache
 */
export async function setS3Only(key: string, data: object): Promise<void> {
  const serializedData = JSON.stringify(data);

  logger.debug('Starting S3-only write operation', { key });

  await retryWithExponentialBackoff(async () => {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: env.DO_SPACES_BUCKET,
        Key: key,
        Body: serializedData,
        ContentType: 'application/json',
      })
    );
    logger.debug('S3-only write successful', { key });
  }, `s3-only-set-${key}`);
}

/**
 * Get operation: Cache-first with S3 fallback
 */
export async function get<T = object>(key: string): Promise<T | null> {
  logger.debug('Starting cache-first get operation', { key });

  // Try Valkey first (cache)
  try {
    const valkeyResult = await retryWithExponentialBackoff(async () => {
      const client = await getValkeyClient();
      const result = await client.get(key);
      if (result === null) {
        throw new Error('Key not found in cache');
      }
      return result;
    }, `valkey-get-${key}`);

    const parsedData = JSON.parse(valkeyResult) as T;
    logger.debug('Cache hit', { key });
    return parsedData;
  } catch (cacheError) {
    logger.debug('Cache miss, trying S3', {
      key,
      error:
        cacheError instanceof Error ? cacheError.message : String(cacheError),
    });

    // Fallback to S3
    try {
      const s3Result = await retryWithExponentialBackoff(async () => {
        const client = getS3Client();
        const response = await client.send(
          new GetObjectCommand({
            Bucket: env.DO_SPACES_BUCKET,
            Key: key,
          })
        );

        if (!response.Body) {
          throw new Error('No body in S3 response');
        }

        // Convert stream to string
        const bodyText = await response.Body.transformToString();
        return bodyText;
      }, `s3-get-${key}`);

      const parsedData = JSON.parse(s3Result) as T;

      // Update cache with fetched data (fire and forget)
      retryWithExponentialBackoff(async () => {
        const client = await getValkeyClient();
        await client.set(key, s3Result);
      }, `cache-update-${key}`).catch(updateError => {
        logger.warn('Failed to update cache after S3 fetch', {
          key,
          error:
            updateError instanceof Error
              ? updateError.message
              : String(updateError),
        });
      });

      logger.debug('S3 fetch successful, cache updated', { key });
      return parsedData;
    } catch (s3Error) {
      logger.debug('Key not found in S3', {
        key,
        error: s3Error instanceof Error ? s3Error.message : String(s3Error),
      });
      return null;
    }
  }
}

/**
 * Delete operation: Remove from both Valkey and S3
 */
export async function del(key: string): Promise<boolean> {
  logger.debug('Starting dual-delete operation', { key });

  let valkeyDeleted = false;
  let s3Deleted = false;

  // Parallel deletes with individual retry logic
  const valkeyOperation = retryWithExponentialBackoff(async () => {
    const client = await getValkeyClient();
    const result = await client.del(key);
    valkeyDeleted = result > 0;
    logger.debug('Valkey delete result', { key, deleted: valkeyDeleted });
  }, `valkey-del-${key}`).catch(error => {
    logger.warn('Valkey delete failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  const s3Operation = retryWithExponentialBackoff(async () => {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.DO_SPACES_BUCKET,
        Key: key,
      })
    );
    s3Deleted = true;
    logger.debug('S3 delete successful', { key });
  }, `s3-del-${key}`).catch(error => {
    logger.warn('S3 delete failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  // Execute both operations in parallel
  await Promise.all([valkeyOperation, s3Operation]);

  const overallSuccess = valkeyDeleted || s3Deleted;
  logger.info('Dual-delete completed', {
    key,
    valkeyDeleted,
    s3Deleted,
    success: overallSuccess,
  });

  return overallSuccess;
}

/**
 * Check if a key exists in either Valkey or S3
 */
export async function exists(key: string): Promise<boolean> {
  logger.debug('Checking key existence', { key });

  // Check Valkey first (faster)
  try {
    const client = await getValkeyClient();
    const result = await client.exists(key);
    if (result === 1) {
      logger.debug('Key exists in cache', { key });
      return true;
    }
  } catch (error) {
    logger.debug('Cache exists check failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Check S3 as fallback
  try {
    const client = getS3Client();
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    await client.send(
      new HeadObjectCommand({
        Bucket: env.DO_SPACES_BUCKET,
        Key: key,
      })
    );
    logger.debug('Key exists in S3', { key });
    return true;
  } catch (error) {
    logger.debug('Key not found in S3', { key });
    return false;
  }
}

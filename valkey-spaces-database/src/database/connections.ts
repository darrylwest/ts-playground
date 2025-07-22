import Valkey from 'iovalkey';
import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// Global connection instances
let valkeyClient: Valkey | null = null;
let s3Client: S3Client | null = null;

/**
 * Initialize and return Valkey client connection
 */
export async function getValkeyClient(): Promise<Valkey> {
  if (valkeyClient && valkeyClient.status === 'ready') {
    return valkeyClient;
  }

  try {
    logger.info('Initializing Valkey connection', {
      host: env.VALKEY_HOST,
      port: env.VALKEY_PORT,
    });

    const config: any = {
      host: env.VALKEY_HOST,
      port: env.VALKEY_PORT,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
    };

    if (env.VALKEY_PASSWORD) {
      config.password = env.VALKEY_PASSWORD;
    }

    valkeyClient = new Valkey(config);

    // Event handlers
    valkeyClient.on('connect', () => {
      logger.info('Valkey client connected');
    });

    valkeyClient.on('ready', () => {
      logger.info('Valkey client ready');
    });

    valkeyClient.on('error', (error: Error) => {
      logger.error('Valkey client error', { error: error.message });
    });

    valkeyClient.on('close', () => {
      logger.warn('Valkey connection closed');
    });

    valkeyClient.on('reconnecting', () => {
      logger.info('Valkey client reconnecting');
    });

    // Connect to Valkey
    await valkeyClient.connect();

    logger.info('Valkey connection established successfully');
    return valkeyClient;
  } catch (error) {
    logger.error('Failed to connect to Valkey', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Valkey connection failed: ${error}`);
  }
}

/**
 * Initialize and return S3 client connection
 */
export function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  try {
    logger.info('Initializing S3 client', {
      endpoint: env.DO_SPACES_ENDPOINT,
      bucket: env.DO_SPACES_BUCKET,
    });

    s3Client = new S3Client({
      endpoint: env.DO_SPACES_ENDPOINT,
      region: 'us-east-1', // Required but ignored by DO Spaces
      credentials: {
        accessKeyId: env.DO_SPACES_KEY,
        secretAccessKey: env.DO_SPACES_SECRET,
      },
      forcePathStyle: false, // Required for DO Spaces
    });

    logger.info('S3 client initialized successfully');
    return s3Client;
  } catch (error) {
    logger.error('Failed to initialize S3 client', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`S3 client initialization failed: ${error}`);
  }
}

/**
 * Health check for Valkey connection
 */
export async function checkValkeyHealth(): Promise<boolean> {
  try {
    const client = await getValkeyClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Valkey health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Health check for S3 connection
 */
export async function checkS3Health(): Promise<boolean> {
  try {
    const client = getS3Client();
    // Simple operation to test S3 connectivity
    const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
    await client.send(
      new HeadBucketCommand({
        Bucket: env.DO_SPACES_BUCKET,
      })
    );
    return true;
  } catch (error) {
    logger.error('S3 health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Gracefully close all database connections
 */
export async function closeConnections(): Promise<void> {
  logger.info('[CONNECTIONS] Starting closeConnections');

  const promises: Promise<void>[] = [];

  if (valkeyClient) {
    logger.info('[CONNECTIONS] Valkey client exists, status:', { status: valkeyClient.status });
    promises.push(
      (async () => {
        try {
          logger.info('[CONNECTIONS] Calling valkeyClient.disconnect()');
          await valkeyClient!.disconnect();
          logger.info('[CONNECTIONS] Valkey disconnect completed');
        } catch (error) {
          logger.error('[CONNECTIONS] Error during Valkey disconnect', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })()
    );
    logger.info('[CONNECTIONS] Setting valkeyClient to null');
    valkeyClient = null;
  } else {
    logger.info('[CONNECTIONS] No Valkey client to close');
  }

  // S3 client doesn't need explicit closing
  if (s3Client) {
    logger.info('[CONNECTIONS] Destroying S3 client');
    s3Client.destroy();
    s3Client = null;
    logger.info('[CONNECTIONS] S3 client destroyed');
  } else {
    logger.info('[CONNECTIONS] No S3 client to destroy');
  }

  logger.info('[CONNECTIONS] Waiting for all disconnect promises');
  await Promise.all(promises);
  logger.info('[CONNECTIONS] All database connections closed successfully');
}

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
  jitter?: boolean;
}

/**
 * Exponential backoff retry utility with jitter
 */
export async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  context: string,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = env.RETRY_MAX_ATTEMPTS,
    baseDelay = env.RETRY_BASE_DELAY,
    maxDelay = env.RETRY_MAX_DELAY,
    exponentialBase = 2,
    jitter = true,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        logger.info('Operation succeeded after retry', {
          context,
          attempt,
          totalAttempts: maxAttempts,
        });
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        logger.error('Operation failed after all retry attempts', {
          context,
          attempts: maxAttempts,
          error: lastError.message,
        });
        break;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(
        baseDelay * Math.pow(exponentialBase, attempt - 1),
        maxDelay
      );

      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      logger.warn('Operation failed, retrying', {
        context,
        attempt,
        totalAttempts: maxAttempts,
        delay,
        error: lastError.message,
      });

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

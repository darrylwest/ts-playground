import { jest } from '@jest/globals';
import { retryWithExponentialBackoff } from '../../../src/database/retry.js';

// Mock the logger
jest.mock('../../../src/config/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock environment
jest.mock('../../../src/config/env.js', () => ({
  env: {
    RETRY_MAX_ATTEMPTS: 3,
    RETRY_BASE_DELAY: 100, // Faster for tests
    RETRY_MAX_DELAY: 1000,
  },
}));

describe('Retry Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('retryWithExponentialBackoff', () => {
    it('should return result on first success', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithExponentialBackoff(
        mockOperation,
        'test-operation'
      );
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const result = await retryWithExponentialBackoff(
        mockOperation,
        'test-operation'
      );
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(
        retryWithExponentialBackoff(
          mockOperation,
          'test-operation',
          { maxAttempts: 2 }
        )
      ).rejects.toThrow('Persistent failure');
      
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should respect custom retry options', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValue('success');
      
      const result = await retryWithExponentialBackoff(
        mockOperation,
        'test-operation',
        {
          maxAttempts: 5,
          baseDelay: 50,
          maxDelay: 500,
          jitter: false,
        }
      );
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should handle non-Error rejections', async () => {
      const mockOperation = jest.fn().mockRejectedValue('string error');
      
      await expect(
        retryWithExponentialBackoff(
          mockOperation,
          'test-operation',
          { maxAttempts: 1 }
        )
      ).rejects.toThrow('string error');
    });

    it('should apply exponential backoff delays', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      
      await retryWithExponentialBackoff(
        mockOperation,
        'test-operation',
        {
          baseDelay: 100,
          maxDelay: 1000,
          jitter: false, // Disable jitter for predictable timing
        }
      );
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should have waited at least baseDelay + baseDelay*2 = 300ms
      expect(totalTime).toBeGreaterThan(250);
    });

    it('should respect maxDelay', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValue('success');

      await retryWithExponentialBackoff(
        mockOperation,
        'test-operation',
        {
          baseDelay: 1000,
          maxDelay: 200, // Max delay smaller than base delay
          exponentialBase: 2,
          jitter: false,
        }
      );
      
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });
});
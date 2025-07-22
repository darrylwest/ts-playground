/**
 * Integration tests for database operations
 * 
 * Note: These tests require running Valkey and S3-compatible storage.
 * They can be skipped in CI by setting SKIP_INTEGRATION_TESTS=true
 */

import { jest } from '@jest/globals';
import {
  createUser,
  getUserByEmail,
  getUserByKey,
  updateUser,
  deleteUser,
  getUserCount,
  listUsers,
  addEmailMapping,
  getKeyByEmail,
  verifyEmailIndex,
  checkValkeyHealth,
  checkS3Health,
  closeConnections,
} from '../../src/database/index.js';
import { BaseStatus } from '../../src/models/index.js';

// Skip integration tests if environment variable is set
const skipIntegrationTests = process.env.SKIP_INTEGRATION_TESTS === 'true';

describe('Database Integration Tests', () => {
  // Skip all tests if integration tests are disabled
  beforeAll(() => {
    if (skipIntegrationTests) {
      console.log('Skipping integration tests (SKIP_INTEGRATION_TESTS=true)');
    }
  });

  afterAll(async () => {
    if (!skipIntegrationTests) {
      try {
        await closeConnections();
      } catch (error) {
        console.warn('Error closing connections in tests:', error);
      }
    }
  });

  describe('Health Checks', () => {
    it.skipIf(skipIntegrationTests)('should check Valkey health', async () => {
      const isHealthy = await checkValkeyHealth();
      expect(typeof isHealthy).toBe('boolean');
    });

    it.skipIf(skipIntegrationTests)('should check S3 health', async () => {
      const isHealthy = await checkS3Health();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('User Operations', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    let testUserKey: string;

    it.skipIf(skipIntegrationTests)('should create a new user', async () => {
      const userData = {
        first_name: 'Integration',
        last_name: 'Test',
        ip_address: '127.0.0.1',
        roles: 'user',
      };

      const user = await createUser(testEmail, userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(testEmail);
      expect(user.first_name).toBe('Integration');
      expect(user.last_name).toBe('Test');
      expect(user.key).toMatch(/^usr:[a-zA-Z0-9]{12}$/);
      expect(user.version).toBe(0);
      expect(user.status).toBe(BaseStatus.New);

      testUserKey = user.key;
    }, 10000);

    it.skipIf(skipIntegrationTests)('should find user by email', async () => {
      const user = await getUserByEmail(testEmail);

      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);
      expect(user?.key).toBe(testUserKey);
    }, 10000);

    it.skipIf(skipIntegrationTests)('should get user by key', async () => {
      const user = await getUserByKey(testUserKey);

      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);
      expect(user?.key).toBe(testUserKey);
    }, 10000);

    it.skipIf(skipIntegrationTests)('should update user', async () => {
      const updates = {
        status: BaseStatus.Active,
        first_name: 'Updated',
        company_name: 'Test Corp',
      };

      const updatedUser = await updateUser(testUserKey, updates);

      expect(updatedUser.status).toBe(BaseStatus.Active);
      expect(updatedUser.first_name).toBe('Updated');
      expect(updatedUser.company_name).toBe('Test Corp');
      expect(updatedUser.version).toBe(1);
      expect(updatedUser.lastUpdated).toBeGreaterThan(updatedUser.dateCreated);
    }, 10000);

    it.skipIf(skipIntegrationTests)('should handle optimistic locking', async () => {
      // This should fail because we expect version 0 but it's now 1
      await expect(
        updateUser(testUserKey, { first_name: 'ShouldFail' }, 0)
      ).rejects.toThrow('Version mismatch');
    }, 10000);

    it.skipIf(skipIntegrationTests)('should get user count', async () => {
      const count = await getUserCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    }, 10000);

    it.skipIf(skipIntegrationTests)('should list users with pagination', async () => {
      const result = await listUsers(0, 10);

      expect(result).toBeDefined();
      expect(result.users).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(10);
      
      // Our test user should be in the results
      const foundUser = result.users.find(u => u.email === testEmail);
      expect(foundUser).toBeDefined();
    }, 10000);

    it.skipIf(skipIntegrationTests)('should prevent duplicate email addresses', async () => {
      await expect(
        createUser(testEmail, { ip_address: '127.0.0.1', roles: 'user' })
      ).rejects.toThrow(`User with email ${testEmail} already exists`);
    }, 10000);

    it.skipIf(skipIntegrationTests)('should delete user', async () => {
      const deleted = await deleteUser(testUserKey);
      expect(deleted).toBe(true);

      // Verify user is gone
      const user = await getUserByKey(testUserKey);
      expect(user).toBeNull();

      const userByEmail = await getUserByEmail(testEmail);
      expect(userByEmail).toBeNull();
    }, 10000);
  });

  describe('Email Index Operations', () => {
    const testEmail = `index-test-${Date.now()}@example.com`;
    const testKey = `usr:${Math.random().toString(36).substring(2, 14)}`;

    it.skipIf(skipIntegrationTests)('should add email mapping', async () => {
      await addEmailMapping(testEmail, testKey);
      
      const retrievedKey = await getKeyByEmail(testEmail);
      expect(retrievedKey).toBe(testKey);
    }, 10000);

    it.skipIf(skipIntegrationTests)('should verify email index consistency', async () => {
      const verification = await verifyEmailIndex();

      expect(verification).toBeDefined();
      expect(typeof verification.consistent).toBe('boolean');
      expect(typeof verification.valkeyEntries).toBe('number');
      expect(typeof verification.s3Entries).toBe('number');
      expect(Array.isArray(verification.mismatches)).toBe(true);
    }, 10000);

    afterAll(async () => {
      if (!skipIntegrationTests) {
        try {
          // Clean up test data
          const { removeEmailMapping } = await import('../../src/database/index.js');
          await removeEmailMapping(testEmail);
        } catch (error) {
          console.warn('Error cleaning up test email mapping:', error);
        }
      }
    });
  });

  describe('Error Handling', () => {
    it.skipIf(skipIntegrationTests)('should handle non-existent user gracefully', async () => {
      const user = await getUserByKey('usr:nonexistent12');
      expect(user).toBeNull();
    }, 10000);

    it.skipIf(skipIntegrationTests)('should handle non-existent email gracefully', async () => {
      const user = await getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    }, 10000);

    it.skipIf(skipIntegrationTests)('should handle invalid user data', async () => {
      await expect(
        createUser('invalid-email', { ip_address: '127.0.0.1', roles: 'user' })
      ).rejects.toThrow();
    }, 10000);
  });
});
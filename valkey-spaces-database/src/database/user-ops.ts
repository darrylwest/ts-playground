import { User, UserSchema, BaseStatus } from '../models/index.js';
import { createRouteKey } from '../utils/keys.js';
import { set as dbSet, get as dbGet, del as dbDel } from './operations.js';
import {
  addEmailMapping,
  getKeyByEmail,
  removeEmailMapping,
  getAllEmailMappings,
} from './email-index.js';
import { getValkeyClient } from './connections.js';
import { retryWithExponentialBackoff } from './retry.js';
import { logger } from '../config/logger.js';

/**
 * Create a new user with email index mapping
 */
export async function createUser(
  email: string,
  userData: Partial<User>
): Promise<User> {
  logger.info('Creating new user', { email });

  // Check if user already exists
  const existingKey = await getKeyByEmail(email);
  if (existingKey) {
    throw new Error(
      `User with email ${email} already exists with key ${existingKey}`
    );
  }

  // Generate new user key
  const key = await createRouteKey('usr');
  const now = Date.now();

  // Create user object
  const user: User = {
    key,
    email,
    dateCreated: now,
    lastUpdated: now,
    version: 0,
    status: BaseStatus.New,
    roles: userData.roles || 'user',
    ip_address: userData.ip_address || '127.0.0.1', // Default IP for new users
    ...userData, // Override with provided data
  };

  // Validate user data
  const validatedUser = UserSchema.parse(user);

  try {
    // Store user data
    await dbSet(key, validatedUser);

    // Add email mapping
    await addEmailMapping(email, key);

    logger.info('User created successfully', { email, key });
    return validatedUser;
  } catch (error) {
    // Cleanup on failure
    logger.error('User creation failed, attempting cleanup', {
      email,
      key,
      error: error instanceof Error ? error.message : String(error),
    });

    // Try to clean up any partial state
    await Promise.allSettled([dbDel(key), removeEmailMapping(email)]);

    throw error;
  }
}

/**
 * Get user by email address
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  logger.debug('Getting user by email', { email });

  const key = await getKeyByEmail(email);
  if (!key) {
    logger.debug('No user found for email', { email });
    return null;
  }

  return getUserByKey(key);
}

/**
 * Get user by key
 */
export async function getUserByKey(key: string): Promise<User | null> {
  logger.debug('Getting user by key', { key });

  const userData = await dbGet<User>(key);
  if (!userData) {
    logger.debug('No user found for key', { key });
    return null;
  }

  // Validate user data
  try {
    const validatedUser = UserSchema.parse(userData);
    logger.debug('User retrieved successfully', {
      key,
      email: validatedUser.email,
    });
    return validatedUser;
  } catch (error) {
    logger.error('Invalid user data found', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Invalid user data for key ${key}: ${error}`);
  }
}

/**
 * Update user with optimistic locking
 */
export async function updateUser(
  key: string,
  updates: Partial<Omit<User, 'key' | 'dateCreated' | 'version'>>,
  expectedVersion?: number
): Promise<User> {
  logger.debug('Updating user', { key, updates });

  // Get current user
  const currentUser = await getUserByKey(key);
  if (!currentUser) {
    throw new Error(`User not found for key ${key}`);
  }

  // Check version for optimistic locking
  if (
    expectedVersion !== undefined &&
    currentUser.version !== expectedVersion
  ) {
    throw new Error(
      `Version mismatch for user ${key}. Expected ${expectedVersion}, found ${currentUser.version}`
    );
  }

  // Check if email is being changed
  const emailChanged = updates.email && updates.email !== currentUser.email;
  if (emailChanged && updates.email) {
    // Check if new email already exists
    const existingKey = await getKeyByEmail(updates.email);
    if (existingKey && existingKey !== key) {
      throw new Error(
        `Email ${updates.email} already exists for user ${existingKey}`
      );
    }
  }

  // Create updated user
  const updatedUser: User = {
    ...currentUser,
    ...updates,
    lastUpdated: Date.now(),
    version: currentUser.version + 1,
  };

  // Validate updated user
  const validatedUser = UserSchema.parse(updatedUser);

  try {
    // Store updated user
    await dbSet(key, validatedUser);

    // Update email index if email changed
    if (emailChanged && updates.email) {
      await Promise.all([
        removeEmailMapping(currentUser.email),
        addEmailMapping(updates.email, key),
      ]);
      logger.info('Email index updated for user', {
        key,
        oldEmail: currentUser.email,
        newEmail: updates.email,
      });
    }

    logger.info('User updated successfully', {
      key,
      version: validatedUser.version,
    });
    return validatedUser;
  } catch (error) {
    logger.error('User update failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Delete user and clean up email index
 */
export async function deleteUser(key: string): Promise<boolean> {
  logger.info('Deleting user', { key });

  // Get user to find email for cleanup
  const user = await getUserByKey(key);
  if (!user) {
    logger.debug('User not found for deletion', { key });
    return false;
  }

  try {
    // Delete user data and email mapping in parallel
    const [userDeleted, emailRemoved] = await Promise.all([
      dbDel(key),
      removeEmailMapping(user.email),
    ]);

    const success = userDeleted || emailRemoved;
    logger.info('User deletion completed', {
      key,
      email: user.email,
      userDeleted,
      emailRemoved,
      success,
    });

    return success;
  } catch (error) {
    logger.error('User deletion failed', {
      key,
      email: user.email,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * List users with pagination
 */
export async function listUsers(
  offset: number = 0,
  limit: number = 20
): Promise<{
  users: User[];
  total: number;
  offset: number;
  limit: number;
}> {
  logger.debug('Listing users', { offset, limit });

  try {
    // Get all email mappings
    const emailMappings = await getAllEmailMappings();
    const userKeys = Object.values(emailMappings);
    const total = userKeys.length;

    // Apply pagination
    const paginatedKeys = userKeys.slice(offset, offset + limit);

    // Fetch user data in parallel
    const users = await Promise.all(
      paginatedKeys.map(async key => {
        try {
          return await getUserByKey(key);
        } catch (error) {
          logger.warn('Failed to load user in list operation', {
            key,
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        }
      })
    );

    // Filter out null results
    const validUsers = users.filter((user): user is User => user !== null);

    logger.debug('Users listed successfully', {
      total,
      returned: validUsers.length,
      offset,
      limit,
    });

    return {
      users: validUsers,
      total,
      offset,
      limit,
    };
  } catch (error) {
    logger.error('Failed to list users', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get total user count
 */
export async function getUserCount(): Promise<number> {
  logger.info('[USER-OPS] Starting getUserCount');

  try {
    logger.info('[USER-OPS] Calling getAllEmailMappings');
    const emailMappings = await getAllEmailMappings();
    logger.info('[USER-OPS] getAllEmailMappings completed, processing results');
    
    const count = Object.keys(emailMappings).length;
    logger.info('[USER-OPS] User count calculated', { count });
    
    return count;
  } catch (error) {
    logger.error('[USER-OPS] Failed to get user count', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Check if user exists by email
 */
export async function userExists(email: string): Promise<boolean> {
  logger.debug('Checking if user exists', { email });

  try {
    const key = await getKeyByEmail(email);
    const exists = key !== null;

    logger.debug('User existence check completed', { email, exists });
    return exists;
  } catch (error) {
    logger.error('Failed to check user existence', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get all user keys (for administrative operations)
 */
export async function getAllUserKeys(): Promise<string[]> {
  logger.debug('Getting all user keys');

  try {
    const client = await getValkeyClient();

    const userKeys = await retryWithExponentialBackoff(async () => {
      return await client.keys('usr:*');
    }, 'get-all-user-keys');

    logger.debug('Retrieved all user keys', { count: userKeys.length });
    return userKeys;
  } catch (error) {
    logger.error('Failed to get all user keys', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

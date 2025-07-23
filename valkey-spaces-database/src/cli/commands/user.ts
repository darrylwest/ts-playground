import {
  createUser,
  getUserByEmail,
  getUserByKey,
  updateUser,
  listUsers,
  getUserCount,
} from '../../database/index.js';
import { BaseStatus } from '../../models/index.js';
// CLI utilities and types imported via utils.js
import {
  createSuccessResponse,
  createErrorResponse,
  isValidEmail,
  isValidUserKey,
  parseNumber,
  parseKeyValueArgs,
  showUsage,
  handleCommand,
} from '../utils.js';

/**
 * Create a new user with random test data
 * Usage: create-user 'henry.jones@test.com'
 */
export async function createUserCommand(args: string[]): Promise<void> {
  await handleCommand('create-user', async () => {
    if (args.length !== 1) {
      const response = createErrorResponse('Email address is required');
      response.message = 'Usage: npm run create-user <email>\n\nExamples:\nnpm run create-user "henry.jones@test.com"';
      return response;
    }

    const email = args[0];
    if (!isValidEmail(email)) {
      return createErrorResponse('Invalid email address format');
    }

    // Generate random test data
    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    
    const userData = {
      first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
      last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
      phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      ip_address: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      company_name: Math.random() > 0.5 ? 'Test Company Inc.' : undefined,
      roles: 'user',
    };

    const user = await createUser(email, userData);
    return createSuccessResponse(user, `User created successfully with key ${user.key}`);
  });
}

/**
 * Find user by email address
 * Usage: find-user 'henry.jones@test.com'
 */
export async function findUserCommand(args: string[]): Promise<void> {
  await handleCommand('find-user', async () => {
    if (args.length !== 1) {
      showUsage(
        'find-user',
        'npm run find-user <email>',
        ['npm run find-user "henry.jones@test.com"']
      );
      return createErrorResponse('Email address is required');
    }

    const email = args[0];
    if (!isValidEmail(email)) {
      return createErrorResponse('Invalid email address format');
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return createErrorResponse(`User not found for email: ${email}`);
    }

    return createSuccessResponse(user, `User found with key ${user.key}`);
  });
}

/**
 * Get user by key
 * Usage: get-user usr:81q3XaaUZzF5
 */
export async function getUserCommand(args: string[]): Promise<void> {
  await handleCommand('get-user', async () => {
    if (args.length !== 1) {
      showUsage(
        'get-user',
        'npm run get-user <user-key>',
        ['npm run get-user "usr:81q3XaaUZzF5"']
      );
      return createErrorResponse('User key is required');
    }

    const key = args[0];
    if (!isValidUserKey(key)) {
      return createErrorResponse('Invalid user key format (expected: usr:XXXXXXXXXXXX)');
    }

    const user = await getUserByKey(key);
    if (!user) {
      return createErrorResponse(`User not found for key: ${key}`);
    }

    return createSuccessResponse(user, `User retrieved successfully`);
  });
}

/**
 * Update user fields
 * Usage: update-user usr:81q3XaaUZzF5 status=active first_name=John
 */
export async function updateUserCommand(args: string[]): Promise<void> {
  await handleCommand('update-user', async () => {
    if (args.length < 2) {
      showUsage(
        'update-user',
        'npm run update-user <user-key> <field>=<value> [<field>=<value>...]',
        [
          'npm run update-user "usr:81q3XaaUZzF5" status=active',
          'npm run update-user "usr:81q3XaaUZzF5" first_name=John last_name=Doe',
        ]
      );
      return createErrorResponse('User key and at least one field update are required');
    }

    const key = args[0];
    if (!isValidUserKey(key)) {
      return createErrorResponse('Invalid user key format (expected: usr:XXXXXXXXXXXX)');
    }

    // Parse field updates
    const updates = parseKeyValueArgs(args.slice(1));
    if (Object.keys(updates).length === 0) {
      return createErrorResponse('At least one field update is required (format: field=value)');
    }

    // Validate and convert field types
    const validatedUpdates: any = {};
    
    for (const [field, value] of Object.entries(updates)) {
      switch (field) {
        case 'status':
          if (!Object.values(BaseStatus).includes(value as BaseStatus)) {
            return createErrorResponse(`Invalid status: ${value}. Valid values: ${Object.values(BaseStatus).join(', ')}`);
          }
          validatedUpdates.status = value as BaseStatus;
          break;
          
        case 'email':
          if (!isValidEmail(value)) {
            return createErrorResponse(`Invalid email format: ${value}`);
          }
          validatedUpdates.email = value;
          break;
          
        case 'first_name':
        case 'last_name':
        case 'phone':
        case 'ip_address':
        case 'roles':
        case 'company_name':
          validatedUpdates[field] = value;
          break;
          
        default:
          return createErrorResponse(`Unknown field: ${field}`);
      }
    }

    const user = await updateUser(key, validatedUpdates);
    return createSuccessResponse(user, `User updated successfully (version: ${user.version})`);
  });
}

/**
 * List users with pagination
 * Usage: list-users 0 20
 */
export async function listUsersCommand(args: string[]): Promise<void> {
  await handleCommand('list-users', async () => {
    if (args.length !== 2) {
      showUsage(
        'list-users',
        'npm run list-users <offset> <limit>',
        [
          'npm run list-users 0 20',
          'npm run list-users 20 10',
        ]
      );
      return createErrorResponse('Offset and limit are required');
    }

    let offset: number;
    let limit: number;

    try {
      offset = parseNumber(args[0], 'offset');
      limit = parseNumber(args[1], 'limit');
    } catch (error) {
      return createErrorResponse(error instanceof Error ? error.message : String(error));
    }

    if (limit > 100) {
      return createErrorResponse('Limit cannot exceed 100');
    }

    const result = await listUsers(offset, limit);
    return createSuccessResponse(
      result,
      `Retrieved ${result.users.length} users (${result.offset + 1}-${Math.min(result.offset + result.limit, result.total)} of ${result.total})`
    );
  });
}

/**
 * Get total user count
 * Usage: get-user-count
 */
export async function getUserCountCommand(args: string[]): Promise<void> {
  await handleCommand('get-user-count', async () => {
    if (args.length !== 0) {
      showUsage(
        'get-user-count',
        'npm run get-user-count',
        ['npm run get-user-count']
      );
      return createErrorResponse('No arguments expected');
    }

    const count = await getUserCount();
    return createSuccessResponse(
      { count },
      `Total users: ${count}`
    );
  });
}
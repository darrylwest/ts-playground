import {
  checkValkeyHealth,
  checkS3Health,
  verifyEmailIndex,
  rebuildEmailIndex,
  getAllUserKeys,
  closeConnections,
} from '../../database/index.js';
// CLI utilities and types imported via utils.js
import {
  createSuccessResponse,
  createErrorResponse,
  showUsage,
  handleCommand,
} from '../utils.js';

/**
 * Verify email index consistency
 * Usage: verify-email-index
 */
export async function verifyEmailIndexCommand(args: string[]): Promise<void> {
  await handleCommand('verify-email-index', async () => {
    if (args.length !== 0) {
      showUsage(
        'verify-email-index',
        'npm run verify-email-index',
        ['npm run verify-email-index']
      );
      return createErrorResponse('No arguments expected');
    }

    const verification = await verifyEmailIndex();
    
    const message = verification.consistent
      ? 'Email index is consistent'
      : `Email index inconsistencies found: ${verification.mismatches.length} mismatches`;

    return createSuccessResponse(verification, message);
  });
}

/**
 * Rebuild email index from scratch
 * Usage: rebuild-email-index
 */
export async function rebuildEmailIndexCommand(args: string[]): Promise<void> {
  await handleCommand('rebuild-email-index', async () => {
    if (args.length !== 0) {
      showUsage(
        'rebuild-email-index',
        'npm run rebuild-email-index',
        ['npm run rebuild-email-index']
      );
      return createErrorResponse('No arguments expected');
    }

    // Get all user keys first
    const userKeys = await getAllUserKeys();
    
    if (userKeys.length === 0) {
      return createSuccessResponse(
        { rebuilt: true, usersProcessed: 0 },
        'No users found - email index cleared'
      );
    }

    // Rebuild the index
    await rebuildEmailIndex(userKeys);
    
    return createSuccessResponse(
      { rebuilt: true, usersProcessed: userKeys.length },
      `Email index rebuilt successfully from ${userKeys.length} users`
    );
  });
}

/**
 * Health check for database connections
 * Usage: health-check
 */
export async function healthCheckCommand(args: string[]): Promise<void> {
  await handleCommand('health-check', async () => {
    if (args.length !== 0) {
      showUsage(
        'health-check',
        'npm run health-check',
        ['npm run health-check']
      );
      return createErrorResponse('No arguments expected');
    }

    // Check both services in parallel
    const [valkeyHealthy, s3Healthy] = await Promise.all([
      checkValkeyHealth().catch(() => false),
      checkS3Health().catch(() => false),
    ]);

    const overall = valkeyHealthy && s3Healthy;
    
    const health = {
      valkey: valkeyHealthy,
      s3: s3Healthy,
      overall,
    };

    const message = overall
      ? 'All services are healthy'
      : `Service issues detected - Valkey: ${valkeyHealthy ? 'OK' : 'FAIL'}, S3: ${s3Healthy ? 'OK' : 'FAIL'}`;

    // Use success response even if unhealthy, as the command itself succeeded
    return createSuccessResponse(health, message);
  });
}

/**
 * Show database statistics
 * Usage: show-stats
 */
export async function showStatsCommand(args: string[]): Promise<void> {
  await handleCommand('show-stats', async () => {
    if (args.length !== 0) {
      showUsage(
        'show-stats',
        'npm run show-stats',
        ['npm run show-stats']
      );
      return createErrorResponse('No arguments expected');
    }

    try {
      // Gather statistics
      const [userKeys, emailVerification, health] = await Promise.all([
        getAllUserKeys().catch(() => []),
        verifyEmailIndex().catch(() => ({ 
          consistent: false, 
          valkeyEntries: 0, 
          s3Entries: 0, 
          mismatches: [] 
        })),
        Promise.all([
          checkValkeyHealth().catch(() => false),
          checkS3Health().catch(() => false),
        ]).then(([valkey, s3]) => ({ valkey, s3, overall: valkey && s3 })),
      ]);

      const stats = {
        totalUsers: userKeys.length,
        emailIndex: {
          consistent: emailVerification.consistent,
          valkeyEntries: emailVerification.valkeyEntries,
          s3Entries: emailVerification.s3Entries,
          mismatches: emailVerification.mismatches.length,
        },
        health: {
          valkey: health.valkey,
          s3: health.s3,
          overall: health.overall,
        },
        timestamp: new Date().toISOString(),
      };

      return createSuccessResponse(stats, 'Database statistics retrieved successfully');
    } catch (error) {
      return createErrorResponse(
        `Failed to gather statistics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

/**
 * Gracefully shutdown and close connections
 * Usage: shutdown
 */
export async function shutdownCommand(args: string[]): Promise<void> {
  await handleCommand('shutdown', async () => {
    if (args.length !== 0) {
      showUsage(
        'shutdown',
        'npm run shutdown',
        ['npm run shutdown']
      );
      return createErrorResponse('No arguments expected');
    }

    await closeConnections();
    
    return createSuccessResponse(
      { shutdown: true },
      'Database connections closed successfully'
    );
  });
}
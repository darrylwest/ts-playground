#!/usr/bin/env node

import { logger } from '../config/logger.js';
import { createErrorResponse, outputResponse } from './utils.js';

// Import command handlers
import {
  createUserCommand,
  findUserCommand,
  getUserCommand,
  updateUserCommand,
  listUsersCommand,
  getUserCountCommand,
} from './commands/user.js';

import {
  verifyEmailIndexCommand,
  rebuildEmailIndexCommand,
  healthCheckCommand,
  showStatsCommand,
  shutdownCommand,
} from './commands/admin.js';

// Command registry
const commands: Record<string, (args: string[]) => Promise<void>> = {
  // User management commands
  'create-user': createUserCommand,
  'find-user': findUserCommand,
  'get-user': getUserCommand,
  'update-user': updateUserCommand,
  'list-users': listUsersCommand,
  'get-user-count': getUserCountCommand,
  
  // Admin commands
  'verify-email-index': verifyEmailIndexCommand,
  'rebuild-email-index': rebuildEmailIndexCommand,
  'health-check': healthCheckCommand,
  'show-stats': showStatsCommand,
  'shutdown': shutdownCommand,
};

/**
 * Show available commands
 */
function showHelp(): void {
  const helpText = `
Valkey Spaces Database CLI

USAGE:
  node dist/cli/index.js <command> [args...]
  
  Or use npm scripts:
  npm run <command> [args...]

USER MANAGEMENT COMMANDS:
  create-user <email>                    Create a new user with random test data
  find-user <email>                      Find user by email address  
  get-user <user-key>                    Get user by key
  update-user <key> <field>=<value>      Update user fields
  list-users <offset> <limit>            List users with pagination
  get-user-count                         Get total user count

ADMIN COMMANDS:
  verify-email-index                     Verify email index consistency
  rebuild-email-index                    Rebuild email index from scratch
  health-check                          Check database connectivity
  show-stats                            Show database statistics
  shutdown                              Close database connections

EXAMPLES:
  npm run create-user "john.doe@example.com"
  npm run find-user "john.doe@example.com"
  npm run get-user "usr:81q3XaaUZzF5"
  npm run update-user "usr:81q3XaaUZzF5" status=active
  npm run list-users 0 20
  npm run health-check

For more information, visit: https://github.com/your-repo/valkey-spaces-database
`;

  console.log(helpText);
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
      showHelp();
      return;
    }

    const [command, ...commandArgs] = args;
    const handler = commands[command];

    if (!handler) {
      logger.error(`Unknown command: ${command}`);
      outputResponse(createErrorResponse(`Unknown command: ${command}. Use --help to see available commands.`));
      process.exit(1);
    }

    // Execute the command
    await handler(commandArgs);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('CLI execution failed', { error: errorMessage });
    
    outputResponse(createErrorResponse(`CLI execution failed: ${errorMessage}`));
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', { promise, reason });
  outputResponse(createErrorResponse('Unexpected error occurred'));
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', { error: error.message });
  outputResponse(createErrorResponse('Fatal error occurred'));
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  
  try {
    const { closeConnections } = await import('../database/index.js');
    await closeConnections();
  } catch (error) {
    logger.error('Error during shutdown:', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  
  try {
    const { closeConnections } = await import('../database/index.js');
    await closeConnections();
  } catch (error) {
    logger.error('Error during shutdown:', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
  
  process.exit(0);
});

// Run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Main execution failed:', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    process.exit(1);
  });
}
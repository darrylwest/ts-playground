import { CLIResponse } from './types.js';
import { logger } from '../config/logger.js';

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): CLIResponse<T> {
  const response: CLIResponse<T> = {
    success: true,
    data,
  };
  
  if (message) {
    response.message = message;
  }
  
  return response;
}

/**
 * Create an error response
 */
export function createErrorResponse(error: string): CLIResponse {
  return {
    success: false,
    error,
  };
}

/**
 * Output CLI response as JSON
 */
export function outputResponse(response: CLIResponse): void {
  console.log(JSON.stringify(response, null, 2));
}

/**
 * Parse command arguments for key=value pairs
 */
export function parseKeyValueArgs(args: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  
  for (const arg of args) {
    const equalIndex = arg.indexOf('=');
    if (equalIndex > 0) {
      const key = arg.substring(0, equalIndex).trim();
      const value = arg.substring(equalIndex + 1).trim();
      parsed[key] = value;
    }
  }
  
  return parsed;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate user key format
 */
export function isValidUserKey(key: string): boolean {
  return /^usr:[a-zA-Z0-9]{12}$/.test(key);
}

/**
 * Parse numeric argument
 */
export function parseNumber(value: string, paramName: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid ${paramName}: must be a non-negative number`);
  }
  return num;
}

/**
 * Handle CLI errors with proper logging and response
 */
export async function handleCommand(
  commandName: string,
  handler: () => Promise<CLIResponse>
): Promise<void> {
  try {
    logger.info(`[CLI] Starting command execution: ${commandName}`);
    const response = await handler();
    logger.info(`[CLI] Command handler completed: ${commandName}`, { success: response.success });
    
    if (response.success) {
      logger.info(`[CLI] Command succeeded: ${commandName}`);
    } else {
      logger.warn(`[CLI] Command failed: ${commandName}`, { error: response.error });
    }
    
    logger.info(`[CLI] Outputting response for: ${commandName}`);
    outputResponse(response);
    logger.info(`[CLI] Response output completed for: ${commandName}`);

    // Close database connections after command completion
    logger.info(`[CLI] Starting connection cleanup for: ${commandName}`);
    try {
      const { closeConnections } = await import('../database/index.js');
      logger.info(`[CLI] Calling closeConnections for: ${commandName}`);
      await closeConnections();
      logger.info(`[CLI] Database connections closed successfully for: ${commandName}`);
    } catch (closeError) {
      logger.error(`[CLI] Error closing connections for: ${commandName}`, {
        error: closeError instanceof Error ? closeError.message : String(closeError)
      });
    }
    
    logger.info(`[CLI] Command execution fully completed: ${commandName}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[CLI] Command execution error: ${commandName}`, { error: errorMessage });
    
    outputResponse(createErrorResponse(errorMessage));
    
    // Try to close connections even on error
    logger.info(`[CLI] Attempting emergency connection cleanup for: ${commandName}`);
    try {
      const { closeConnections } = await import('../database/index.js');
      await closeConnections();
      logger.info(`[CLI] Emergency connection cleanup completed for: ${commandName}`);
    } catch (closeError) {
      logger.error(`[CLI] Emergency connection cleanup failed for: ${commandName}`, {
        error: closeError instanceof Error ? closeError.message : String(closeError)
      });
    }
    
    logger.info(`[CLI] Exiting with error code 1 for: ${commandName}`);
    process.exit(1);
  }
}

/**
 * Show command usage
 */
export function showUsage(_command: string, usage: string, examples?: string[]): void {
  const response = createErrorResponse(`Usage: ${usage}`);
  
  if (examples && examples.length > 0) {
    response.message = `Examples:\n${examples.join('\n')}`;
  }
  
  outputResponse(response);
}
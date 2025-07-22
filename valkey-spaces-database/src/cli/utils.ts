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
    logger.info(`Executing CLI command: ${commandName}`);
    const response = await handler();
    
    if (response.success) {
      logger.info(`CLI command completed successfully: ${commandName}`);
    } else {
      logger.warn(`CLI command failed: ${commandName}`, { error: response.error });
    }
    
    outputResponse(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`CLI command error: ${commandName}`, { error: errorMessage });
    
    outputResponse(createErrorResponse(errorMessage));
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
import { User } from '../models/index.js';

// CLI Response types
export interface CLIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserResponse extends CLIResponse<User> {}

export interface UsersListResponse extends CLIResponse<{
  users: User[];
  total: number;
  offset: number;
  limit: number;
}> {}

export interface CountResponse extends CLIResponse<{ count: number }> {}

export interface HealthResponse extends CLIResponse<{
  valkey: boolean;
  s3: boolean;
  overall: boolean;
}> {}

export interface IndexVerificationResponse extends CLIResponse<{
  consistent: boolean;
  valkeyEntries: number;
  s3Entries: number;
  mismatches: string[];
}> {}

// Command handler type
export type CommandHandler = (args: string[]) => Promise<CLIResponse>;
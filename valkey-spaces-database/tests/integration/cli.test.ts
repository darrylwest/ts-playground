/**
 * CLI Command Integration Tests
 * 
 * Tests CLI commands end-to-end by executing the actual CLI binary
 */

// CLI integration testing utilities
import { spawn } from 'child_process';

const skipCliTests = process.env.SKIP_CLI_TESTS === 'true';

// Helper to execute CLI commands
async function execCliCommand(command: string, args: string[] = []): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['dotenvx', 'run', '--', 'node', 'dist/cli/index.js', command, ...args], {
      stdio: 'pipe',
      env: {
        ...process.env,
        LOG_LEVEL: 'error', // Suppress most logging during tests
        NODE_ENV: 'test'    // Ensure we're in test mode
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
      });
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      resolve({
        stdout,
        stderr,
        exitCode: 1,
      });
    }, 30000);
  });
}

// Helper to parse JSON response
function parseJsonResponse(stdout: string): any {
  try {
    // Remove ANSI color codes first
    const cleanOutput = stdout.replace(/\x1b\[[0-9;]*m/g, '');
    
    // Split into lines and filter out dotenvx messages and empty lines
    const lines = cleanOutput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => !line.includes('[dotenvx@') && !line.includes('injecting env'));
    
    // Find JSON objects and parse them
    const jsonObjects = [];
    let i = 0;
    
    while (i < lines.length) {
      if (lines[i].startsWith('{')) {
        let jsonString = '';
        let braceCount = 0;
        let j = i;
        
        // Collect all lines that are part of this JSON object
        while (j < lines.length) {
          jsonString += lines[j];
          
          for (const char of lines[j]) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
          }
          
          j++;
          if (braceCount === 0) break;
        }
        
        try {
          const parsed = JSON.parse(jsonString);
          jsonObjects.push(parsed);
        } catch (parseError) {
          // Skip invalid JSON
        }
        
        i = j;
      } else {
        i++;
      }
    }
    
    if (jsonObjects.length === 0) {
      console.log('No valid JSON found in cleaned output.');
      console.log('Original stdout:', stdout);
      console.log('Cleaned lines:', lines);
      return null;
    }
    
    // Return the last JSON object (most relevant for final command result)
    return jsonObjects[jsonObjects.length - 1];
  } catch (error) {
    console.log('JSON parse error:', error);
    console.log('Raw stdout:', stdout);
    return null;
  }
}

describe('CLI Command Integration Tests', () => {
  beforeAll(() => {
    if (skipCliTests) {
      console.log('Skipping CLI tests (SKIP_CLI_TESTS=true)');
    }
  });

  describe('Help and Usage', () => {
    (skipCliTests ? it.skip : it)('should show help', async () => {
      const result = await execCliCommand('--help');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Valkey Spaces Database CLI');
      expect(result.stdout).toContain('USER MANAGEMENT COMMANDS');
      expect(result.stdout).toContain('ADMIN COMMANDS');
    });

    (skipCliTests ? it.skip : it)('should show usage for invalid commands', async () => {
      const result = await execCliCommand('invalid-command');
      
      expect(result.exitCode).toBe(1);
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(false);
      expect(response?.error).toContain('Unknown command');
    });
  });

  describe('Admin Commands', () => {
    (skipCliTests ? it.skip : it)('should execute health-check', async () => {
      const result = await execCliCommand('health-check');
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(true);
      expect(response?.data).toHaveProperty('valkey');
      expect(response?.data).toHaveProperty('s3');
      expect(response?.data).toHaveProperty('overall');
    });

    (skipCliTests ? it.skip : it)('should execute get-user-count', async () => {
      const result = await execCliCommand('get-user-count');
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(true);
      expect(response?.data).toHaveProperty('count');
      expect(typeof response?.data?.count).toBe('number');
    });

    (skipCliTests ? it.skip : it)('should execute verify-email-index', async () => {
      const result = await execCliCommand('verify-email-index');
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(true);
      expect(response?.data).toHaveProperty('consistent');
      expect(response?.data).toHaveProperty('valkeyEntries');
      expect(response?.data).toHaveProperty('s3Entries');
    });
  });

  describe('User Commands', () => {
    const testEmail = `cli-test-${Date.now()}@example.com`;
    let testUserKey: string;

    (skipCliTests ? it.skip : it)('should show usage for create-user without email', async () => {
      const result = await execCliCommand('create-user');
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(false);
      expect(response?.error).toContain('Email address is required');
    });

    (skipCliTests ? it.skip : it)('should create a new user', async () => {
      const result = await execCliCommand('create-user', [testEmail]);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(true);
      expect(response?.data).toHaveProperty('key');
      expect(response?.data?.email).toBe(testEmail);
      expect(response?.data?.key).toMatch(/^usr:[a-zA-Z0-9]{12}$/);
      
      testUserKey = response.data.key;
    });

    (skipCliTests ? it.skip : it)('should find user by email', async () => {
      const result = await execCliCommand('find-user', [testEmail]);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(true);
      expect(response?.data?.email).toBe(testEmail);
      expect(response?.data?.key).toBe(testUserKey);
    });

    (skipCliTests ? it.skip : it)('should get user by key', async () => {
      const result = await execCliCommand('get-user', [testUserKey]);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(true);
      expect(response?.data?.email).toBe(testEmail);
      expect(response?.data?.key).toBe(testUserKey);
    });

    (skipCliTests ? it.skip : it)('should update user status', async () => {
      const result = await execCliCommand('update-user', [testUserKey, 'status=active']);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(true);
      expect(response?.data?.status).toBe('active');
      expect(response?.data?.version).toBe(1);
    });

    (skipCliTests ? it.skip : it)('should update multiple user fields', async () => {
      const result = await execCliCommand('update-user', [
        testUserKey, 
        'first_name=CLI',
        'last_name=Test'
      ]);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(true);
      expect(response?.data?.first_name).toBe('CLI');
      expect(response?.data?.last_name).toBe('Test');
      expect(response?.data?.version).toBe(2);
    });

    (skipCliTests ? it.skip : it)('should list users', async () => {
      const result = await execCliCommand('list-users', ['0', '10']);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(true);
      expect(response?.data).toHaveProperty('users');
      expect(response?.data).toHaveProperty('total');
      expect(response?.data?.offset).toBe(0);
      expect(response?.data?.limit).toBe(10);
      expect(Array.isArray(response?.data?.users)).toBe(true);
      
      // Our test user should be in the results
      const foundUser = response?.data?.users?.find((u: any) => u.email === testEmail);
      expect(foundUser).toBeDefined();
    });

    (skipCliTests ? it.skip : it)('should prevent duplicate user creation', async () => {
      const result = await execCliCommand('create-user', [testEmail]);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(false);
      expect(response?.error).toContain('already exists');
    });

    (skipCliTests ? it.skip : it)('should handle invalid email format', async () => {
      const result = await execCliCommand('create-user', ['invalid-email']);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(false);
      expect(response?.error).toContain('Invalid email address format');
    });

    (skipCliTests ? it.skip : it)('should handle invalid user key format', async () => {
      const result = await execCliCommand('get-user', ['invalid-key']);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(false);
      expect(response?.error).toContain('Invalid user key format');
    });

    (skipCliTests ? it.skip : it)('should handle non-existent user', async () => {
      const result = await execCliCommand('find-user', ['nonexistent@example.com']);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(false);
      expect(response?.error).toContain('User not found');
    });
  });

  describe('Validation and Error Handling', () => {
    (skipCliTests ? it.skip : it)('should validate list-users parameters', async () => {
      const result = await execCliCommand('list-users', ['invalid', '10']);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(false);
      expect(response?.error).toContain('must be a non-negative number');
    });

    (skipCliTests ? it.skip : it)('should enforce list-users limit', async () => {
      const result = await execCliCommand('list-users', ['0', '150']);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(false);
      expect(response?.error).toContain('cannot exceed 100');
    });

    (skipCliTests ? it.skip : it)('should validate update-user field names', async () => {
      const result = await execCliCommand('update-user', ['usr:abc123DEF456', 'invalid_field=value']);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(false);
      expect(response?.error).toContain('Unknown field');
    });

    (skipCliTests ? it.skip : it)('should validate status values', async () => {
      const result = await execCliCommand('update-user', ['usr:abc123DEF456', 'status=invalid_status']);
      
      const response = parseJsonResponse(result.stdout);
      expect(response?.success).toBe(false);
      expect(response?.error).toContain('Invalid status');
    });
  });
});
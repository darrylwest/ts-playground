// Jest utilities imported automatically in test environment
import {
  createSuccessResponse,
  createErrorResponse,
  parseKeyValueArgs,
  isValidEmail,
  isValidUserKey,
  parseNumber,
} from '../../../src/cli/utils';

describe('CLI Utilities', () => {
  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const data = { test: 'value' };
      const response = createSuccessResponse(data);
      
      expect(response).toEqual({
        success: true,
        data,
      });
    });

    it('should create success response with data and message', () => {
      const data = { test: 'value' };
      const message = 'Operation completed';
      const response = createSuccessResponse(data, message);
      
      expect(response).toEqual({
        success: true,
        data,
        message,
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response', () => {
      const error = 'Something went wrong';
      const response = createErrorResponse(error);
      
      expect(response).toEqual({
        success: false,
        error,
      });
    });
  });

  describe('parseKeyValueArgs', () => {
    it('should parse key=value pairs', () => {
      const args = ['name=John', 'age=30', 'active=true'];
      const result = parseKeyValueArgs(args);
      
      expect(result).toEqual({
        name: 'John',
        age: '30',
        active: 'true',
      });
    });

    it('should handle empty array', () => {
      const result = parseKeyValueArgs([]);
      expect(result).toEqual({});
    });

    it('should ignore invalid format args', () => {
      const args = ['name=John', 'invalid', 'age=30'];
      const result = parseKeyValueArgs(args);
      
      expect(result).toEqual({
        name: 'John',
        age: '30',
      });
    });

    it('should handle values with spaces', () => {
      const args = ['name=John Doe', 'description=A test user'];
      const result = parseKeyValueArgs(args);
      
      expect(result).toEqual({
        name: 'John Doe',
        description: 'A test user',
      });
    });

    it('should handle multiple equals signs in value', () => {
      const args = ['url=https://example.com/path?param=value'];
      const result = parseKeyValueArgs(args);
      
      expect(result).toEqual({
        url: 'https://example.com/path?param=value',
      });
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];
      
      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        '@domain.com',
        'user@',
        'user@domain',
        'user.domain.com',
        '',
        'user space@domain.com',
      ];
      
      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidUserKey', () => {
    it('should validate correct user key formats', () => {
      const validKeys = [
        'usr:abc123DEF456',
        'usr:xyz789GHI012',
        'usr:123456789012',
      ];
      
      validKeys.forEach(key => {
        expect(isValidUserKey(key)).toBe(true);
      });
    });

    it('should reject invalid user key formats', () => {
      const invalidKeys = [
        'invalid',
        'con:abc123DEF456', // Wrong prefix
        'usr:abc123', // Too short
        'usr:abc123DEF456789', // Too long
        'usr-abc123DEF456', // Wrong separator
        'usr:abc123DEF45G', // Invalid characters
        '',
      ];
      
      invalidKeys.forEach(key => {
        expect(isValidUserKey(key)).toBe(false);
      });
    });
  });

  describe('parseNumber', () => {
    it('should parse valid positive numbers', () => {
      expect(parseNumber('0', 'test')).toBe(0);
      expect(parseNumber('42', 'test')).toBe(42);
      expect(parseNumber('1000', 'test')).toBe(1000);
    });

    it('should throw error for invalid numbers', () => {
      expect(() => parseNumber('invalid', 'test')).toThrow('Invalid test: must be a non-negative number');
      expect(() => parseNumber('', 'test')).toThrow('Invalid test: must be a non-negative number');
      expect(() => parseNumber('-1', 'test')).toThrow('Invalid test: must be a non-negative number');
      expect(() => parseNumber('3.14', 'test')).toBe(3); // parseInt behavior
    });

    it('should use parameter name in error message', () => {
      expect(() => parseNumber('invalid', 'offset')).toThrow('Invalid offset: must be a non-negative number');
      expect(() => parseNumber('invalid', 'limit')).toThrow('Invalid limit: must be a non-negative number');
    });
  });
});
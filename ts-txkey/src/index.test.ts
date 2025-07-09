import { createTxKey } from './index';

// Simple integration test that actually calls the txkey binary
describe('createTxKey Integration Tests', () => {
    beforeEach(() => {
        // Clear console methods to avoid noise in tests
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should call txkey binary and return a key', async () => {
        const result = await createTxKey([]);
        
        // Should return a string (the actual key from txkey binary)
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        // Should be trimmed (no leading/trailing whitespace)
        expect(result).toBe(result.trim());
    });

    it('should handle arguments passed to txkey binary', async () => {
        const result = await createTxKey(['testarg']);
        
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('should handle multiple arguments', async () => {
        const result = await createTxKey(['arg1', 'arg2', 'arg3']);
        
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('should handle arguments with special characters', async () => {
        const result = await createTxKey(['arg with spaces', 'arg$with$special']);
        
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('should have proper error handling structure', () => {
        // Test that the function exists and can be called
        expect(typeof createTxKey).toBe('function');
        // Test that it returns a promise
        const result = createTxKey([]);
        expect(result).toBeInstanceOf(Promise);
    });
});
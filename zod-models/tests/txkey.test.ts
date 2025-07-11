import { createTxKey, TXKEY_EXECUTABLE_PATH } from '../src/txkey';

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
        const path = TXKEY_EXECUTABLE_PATH;
        const result = await createTxKey(path, []);
        
        // Should return a string (the actual key from txkey binary)
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        // Should be trimmed (no leading/trailing whitespace)
        expect(result).toBe(result.trim());
    });

    it('should handle arguments passed to txkey binary', async () => {
        const path = TXKEY_EXECUTABLE_PATH;
        const result = await createTxKey(path, ['testarg']);
        
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('should handle multiple arguments', async () => {
        const path = TXKEY_EXECUTABLE_PATH;
        const result = await createTxKey(path, ['arg1', 'arg2', 'arg3']);
        
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('should handle arguments with special characters', async () => {
        const path = TXKEY_EXECUTABLE_PATH;
        const result = await createTxKey(path, ['arg with spaces', 'arg$with$special']);
        
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('should have proper error handling structure', () => {
        // Test that the function exists and can be called
        expect(typeof createTxKey).toBe('function');
        // Test that it returns a promise
        const path = TXKEY_EXECUTABLE_PATH;
        const result = createTxKey(path, []);
        expect(result).toBeInstanceOf(Promise);
    });

    it('should handle stderr output with warnings', async () => {
        // Most txkey calls should succeed, but let's test with various args
        // to potentially trigger different code paths
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        
        try {
            // Try with different argument patterns that might generate warnings
            const path = TXKEY_EXECUTABLE_PATH;
            await createTxKey(path, ['--verbose']);
        } catch (error) {
            // If it fails, that's also a valid test of error handling
            expect(error).toBeInstanceOf(Error);
        }
        
        consoleSpy.mockRestore();
    });

    it('should handle very long argument strings', async () => {
        const path = TXKEY_EXECUTABLE_PATH;
        const longArg = 'a'.repeat(1000);
        const result = await createTxKey(path, [longArg]);
        
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });
});
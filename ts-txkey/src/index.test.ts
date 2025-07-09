// Mock the modules before any imports
jest.mock('child_process');
jest.mock('util');

import { createTxKey } from './index';
import { promisify } from 'util';
import { exec } from 'child_process';

const mockExec = exec as jest.MockedFunction<typeof exec>;
const mockPromisify = promisify as jest.MockedFunction<typeof promisify>;

describe('createTxKey', () => {
    let mockExecPromise: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create a new mock for each test
        mockExecPromise = jest.fn();
        mockPromisify.mockReturnValue(mockExecPromise);
        
        // Clear console methods to avoid noise in tests
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return a key when txkey executable succeeds', async () => {
        const expectedKey = '81WPUUnaM3Fn';
        mockExecPromise.mockResolvedValue({ stdout: expectedKey + '\n', stderr: '' });

        const result = await createTxKey(['testarg']);
        
        expect(result).toBe(expectedKey);
        expect(mockExecPromise).toHaveBeenCalledWith("/usr/local/bin/txkey 'testarg'");
    });

    it('should handle multiple arguments correctly', async () => {
        const expectedKey = 'multiArgKey123';
        mockExecPromise.mockResolvedValue({ stdout: expectedKey, stderr: '' });

        const result = await createTxKey(['arg1', 'arg2', 'arg3']);
        
        expect(result).toBe(expectedKey);
        expect(mockExecPromise).toHaveBeenCalledWith("/usr/local/bin/txkey 'arg1' 'arg2' 'arg3'");
    });

    it('should handle empty arguments array', async () => {
        const expectedKey = 'emptyArgsKey';
        mockExecPromise.mockResolvedValue({ stdout: expectedKey, stderr: '' });

        const result = await createTxKey([]);
        
        expect(result).toBe(expectedKey);
        expect(mockExecPromise).toHaveBeenCalledWith("/usr/local/bin/txkey ");
    });

    it('should trim whitespace from stdout', async () => {
        const expectedKey = 'trimmedKey';
        mockExecPromise.mockResolvedValue({ stdout: `  ${expectedKey}  \n`, stderr: '' });

        const result = await createTxKey(['test']);
        
        expect(result).toBe(expectedKey);
    });

    it('should warn when stderr contains output but still return key', async () => {
        const expectedKey = 'keyWithWarning';
        const warningMessage = 'Warning: some warning';
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        
        mockExecPromise.mockResolvedValue({ stdout: expectedKey, stderr: warningMessage });

        const result = await createTxKey(['test']);
        
        expect(result).toBe(expectedKey);
        expect(consoleSpy).toHaveBeenCalledWith(`'txkey' executable produced stderr: ${warningMessage}`);
    });

    it('should throw error when stdout is empty', async () => {
        mockExecPromise.mockResolvedValue({ stdout: '', stderr: '' });

        await expect(createTxKey(['test'])).rejects.toThrow("'txkey' executable returned no output.");
    });

    it('should throw error when stdout is only whitespace', async () => {
        mockExecPromise.mockResolvedValue({ stdout: '   \n  ', stderr: '' });

        await expect(createTxKey(['test'])).rejects.toThrow("'txkey' executable returned no output.");
    });

    it('should handle execution errors with exit code', async () => {
        const execError = new Error('Command failed') as any;
        execError.code = 1;
        execError.signal = undefined;
        execError.stderr = 'Command not found';
        
        mockExecPromise.mockRejectedValue(execError);

        await expect(createTxKey(['test'])).rejects.toThrow('Failed to generate key using external \'txkey\' executable. Details: Command failed');
    });

    it('should handle execution errors with signal', async () => {
        const execError = new Error('Process killed') as any;
        execError.code = undefined;
        execError.signal = 'SIGTERM';
        execError.stderr = 'Process terminated';
        
        mockExecPromise.mockRejectedValue(execError);

        await expect(createTxKey(['test'])).rejects.toThrow('Failed to generate key using external \'txkey\' executable. Details: Process killed');
    });

    it('should handle arguments with special characters', async () => {
        const expectedKey = 'specialCharsKey';
        mockExecPromise.mockResolvedValue({ stdout: expectedKey, stderr: '' });

        const result = await createTxKey(['arg with spaces', 'arg$with$special', 'arg"with"quotes']);
        
        expect(result).toBe(expectedKey);
        expect(mockExecPromise).toHaveBeenCalledWith("/usr/local/bin/txkey 'arg with spaces' 'arg$with$special' 'arg\"with\"quotes'");
    });
});
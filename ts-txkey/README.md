# Typescript TxKey


This typescript code invokes a binary runnable `txkey` that generates a unique short key (12 chars).  
Keys are used in k/v store (Valkey, Redis) to uniquely identify records in a specific domain.
The code below ensures that all keys are consistently generated either from c++ or node/typescript.

## Dependencies

* node.js
* ts-node
* jest for unit tests

## Implementation

```typescript

import { exec, ExecException } from 'child_process';
import { promisify } from 'util';

// Promisify exec for easier async/await usage
const execPromise = promisify(exec);

// Path to your compiled 'txkey' executable
// Make sure this path is correct for your development and production environments!
// For example:
// On Ubuntu/macOS: '/usr/local/bin/txkey'
const TXKEY_EXECUTABLE_PATH = '/usr/local/bin/txkey'; // or look up from config

/**
 * Generates a key by invoking an external 'txkey' executable.
 * The 'txkey' executable is expected to take arguments and print the
 * generated key to standard output (stdout).
 *
 * @param args An array of strings representing the arguments to pass to 'txkey'.
 * For example, if './txkey 81WPUUnaM3Fn' is your command,
 * you'd pass ['81WPUUnaM3Fn'].
 * @returns A Promise that resolves with the generated key string from stdout.
 * @throws An error if the executable fails or returns no output.
 */
async function generateKeyExternal(args: string[]): Promise<string> {
    // Construct the command string.
    // Ensure arguments are properly quoted if they might contain spaces or special characters.
    // For a simple string like '81WPUUnaM3Fn', quoting might not be strictly necessary,
    // but it's good practice for robustness.
    const command = `${TXKEY_EXECUTABLE_PATH} ${args.map(arg => `'${arg}'`).join(' ')}`;

    try {
        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            console.warn(`'txkey' executable produced stderr: ${stderr.trim()}`);
            // Depending on your txkey, stderr might indicate non-fatal warnings
            // or critical errors. You might want to throw an error here if stderr indicates failure.
        }

        const key = stdout.trim(); // Remove any leading/trailing whitespace, especially newlines

        if (!key) {
            throw new Error(`'txkey' executable returned no output.`);
        }

        return key;

    } catch (error: any) {
        // execPromise wraps the original ExecException in a generic Error type.
        // We can cast back to ExecException to get error.code, error.signal, etc.
        const execError = error as ExecException;
        console.error(`Error executing 'txkey': ${execError.message}`);
        if (execError.code !== undefined) {
            console.error(`Exit code: ${execError.code}`);
        }
        if (execError.signal !== undefined) {
            console.error(`Signal: ${execError.signal}`);
        }
        if (execError.stderr) {
            console.error(`Stderr: ${execError.stderr.trim()}`);
        }
        // Re-throw a more informative error for the caller
        throw new Error(`Failed to generate key using external 'txkey' executable. Details: ${execError.message}`);
    }
}
```

## Example Usage

```
// Example 1: Invoking 'txkey' with a specific argument
(async () => {
    try {
        const generatedKey1 = await generateKeyExternal(['81WPUUnaM3Fn']);
        console.log('Generated Key 1:', generatedKey1); // Expected: 81WPUUnaM3Fn (or whatever txkey outputs for this input)

        // Example 2: If txkey generates a key without arguments (or with different ones)
        // Adjust the arguments array based on how your txkey actually works.
        // If it generates a key on its own without arguments:
        const generatedKey2 = await generateKeyExternal([]);
        console.log('Generated Key 2 (no args):', generatedKey2); // Expecting something like 'someRandomKeyFromTxkey'

        // Example 3: Error handling - if the executable path is wrong or it fails
        // To test this, you could temporarily set TXKEY_EXECUTABLE_PATH to './non_existent_txkey'
        // const failedKey = await generateKeyExternal([]);
        // console.log(failedKey);

    } catch (err) {
        console.error('An error occurred during key generation:', err);
    }
})();
```

###### dpw | 2025-07-10 | 81WQdNoFUOFK

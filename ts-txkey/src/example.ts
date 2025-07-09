import { createTxKey } from './index';

// Example usage of the createTxKey function
(async () => {
    try {
        // Example 1: Invoking 'txkey' with a specific argument
        const key1 = await createTxKey(['81WPUUnaM3Fn']);
        console.log('Generated Key 1:', key1); // Expected: 81WPUUnaM3Fn (or whatever txkey outputs for this input)

        // Example 2: If txkey generates a key without arguments (or with different ones)
        // Adjust the arguments array based on how your txkey actually works.
        // If it generates a key on its own without arguments:
        const key2 = await createTxKey([]);
        console.log('Generated Key 2 (no args):', key2); // Expecting something like 'someRandomKeyFromTxkey'

        // Example 3: Multiple arguments
        const key3 = await createTxKey(['domain', 'subdomain', 'identifier']);
        console.log('Generated Key 3 (multiple args):', key3);

        // Example 4: Error handling - if the executable path is wrong or it fails
        // To test this, you could temporarily set TXKEY_EXECUTABLE_PATH to './non_existent_txkey'
        // const failedKey = await createTxKey([]);
        // console.log(failedKey);

    } catch (err) {
        console.error('An error occurred during key generation:', err);
    }
})();
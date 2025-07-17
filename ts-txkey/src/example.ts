import { createTxKey } from './index';

// Example usage of the createTxKey function
(async () => {
    try {
        // Example 1: Invoking 'txkey' with a specific argument
        const key1 = await createTxKey();
        console.log('Generated Key 1:', key1); // Expected: 81WPUUnaM3Fn (or whatever txkey outputs for this input)

        // Example 2: If txkey generates a key without arguments (or with different ones)
        // Adjust the arguments array based on how your txkey actually works.
        // If it generates a key on its own without arguments:
        const key2 = await createTxKey([]);
        console.log('Generated Key 2:', key2); // Expecting something like 'someRandomKeyFromTxkey'

        // Example 3: Multiple arguments
        const key3 = await createTxKey(['domain', 'subdomain', 'identifier']);
        console.log('Generated Key 3 (multiple args):', key3);

        let keys: string[] = [];
        const start = process.hrtime.bigint();
        for (let i = 0; i < 100; i++) {
            const key = await createTxKey(['t']);
            keys.push(key);
            // console.log(key);
        }

        const duration = process.hrtime.bigint() - start;
        console.log(`it took ${duration} nanos to generate 100 keys, ${duration / 1000000n} millis`);

    } catch (err) {
        console.error('An error occurred during key generation:', err);
    }
})();

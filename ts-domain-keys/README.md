# Typescript Domain Keys
 
## DomainKey

The DomainKey generates a base62 key unique to a specific domain. It has these features:

* used as unique id in domain models
* uses crypto to generate random numbers
* uses process.hrtime.bigint() for high res nano second clock
* always generates a 16 character key
* sortable, new keys always increase (i.e., dt + random)

## Dependencies

* node.js
* ts-node
* jest for unit tests

## Proposed Use

import { createDomainKey } from 'domainkey';

const key: string = createDomainKey();

console.log('key: ' + key);

## Proposed Implementations

### Base62

File: base62.ts

```
// base62.ts

const BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = BigInt(BASE62_CHARS.length); // 62n

/**
 * Encodes a BigInt into a Base62 string.
 * @param num The BigInt to encode.
 * @returns The Base62 string representation.
 */
export function encodeBase62(num: bigint): string {
    if (num < 0n) {
        throw new Error("Cannot encode negative BigInts to Base62.");
    }
    if (num === 0n) {
        return BASE62_CHARS[0]; // '0'
    }

    let result = '';
    while (num > 0n) {
        const remainder = num % BASE;
        result = BASE62_CHARS[Number(remainder)] + result; // Prepend the character
        num /= BASE; // Integer division
    }
    return result;
}

/**
 * Decodes a Base62 string back into a BigInt.
 * @param str The Base62 string to decode.
 * @returns The decoded BigInt.
 */
export function decodeBase62(str: string): bigint {
    let result = 0n;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const value = BASE62_CHARS.indexOf(char);
        if (value === -1) {
            throw new Error(`Invalid Base62 character: ${char}`);
        }
        result = result * BASE + BigInt(value);
    }
    return result;
}

// Example Usage (optional, for testing the encoder/decoder)
// const testBigInt = 1234567890123456789012345n;
// const encoded = encodeBase62(testBigInt);
// console.log(`Encoded: ${encoded}`); // Example: 's8F929eT6lXg1a'
// const decoded = decodeBase62(encoded);
// console.log(`Decoded: ${decoded}`);
// console.log(`Matches original: ${decoded === testBigInt}`); // true
```

### Domain Key Generation

File: keyGenerator.ts

```TypeScript
// keyGenerator.ts
import { encodeBase62 } from './base62'; // Assuming base62.ts is in the same directory
import * as crypto from 'crypto'; // For Node.js environment

// Define the total key length
const KEY_LENGTH = 16;
// Define how many characters for the timestamp part
// This needs to be determined by experimentation based on the expected magnitude of your BigInt timestamp
// and how many characters it yields in Base62. Let's aim for 10.
const TIMESTAMP_CHAR_LENGTH = 10;
const RANDOM_CHAR_LENGTH = KEY_LENGTH - TIMESTAMP_CHAR_LENGTH;

// The characters for the random part (same as Base62 for simplicity, but could be different)
const RANDOM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generates a Base62 character for a given random byte.
 * Maps a byte (0-255) to a character in BASE62_CHARS.
 * This is a simple uniform distribution attempt, but not cryptographically perfect for uniform Base62 distribution.
 */
function getRandomBase62Char(): string {
    const randomByte = crypto.randomFillSync(new Uint8Array(1))[0];
    // Scale randomByte (0-255) to the range of BASE62_CHARS length (0-61)
    const index = Math.floor(randomByte / 256 * RANDOM_CHARS.length);
    return RANDOM_CHARS[index];
}

export function createDomainKey(): string {
    // 1. Get high-resolution timestamp
    const timestampBigInt = process.hrtime.bigint();

    // 2. Encode timestamp to Base62
    let timestampBase62 = encodeBase62(timestampBigInt);

    // Pad or truncate the timestampBase62 to fit the desired length
    if (timestampBase62.length > TIMESTAMP_CHAR_LENGTH) {
        // If the timestamp is too long, take the last TIMESTAMP_CHAR_LENGTH characters.
        // This is a common strategy as later timestamps will be larger.
        timestampBase62 = timestampBase62.slice(-TIMESTAMP_CHAR_LENGTH);
    } else if (timestampBase62.length < TIMESTAMP_CHAR_LENGTH) {
        // If the timestamp is too short (e.g., very early in the system's uptime),
        // pad it with leading '0's or a chosen character.
        // Using '0' for numerical consistency, or a random character if uniqueness is paramount.
        // For keys, often '0' or some other consistent padding is used.
        timestampBase62 = timestampBase62.padStart(TIMESTAMP_CHAR_LENGTH, '0');
    }

    // 3. Generate remaining random characters
    let randomPart = '';
    for (let i = 0; i < RANDOM_CHAR_LENGTH; i++) {
        randomPart += getRandomBase62Char();
    }

    // 4. Assemble the key
    // You can choose to concatenate them (timestamp first, then random)
    // or interleave them for better entropy distribution.
    // For simplicity, let's concatenate:
    const finalKey = timestampBase62 + randomPart;

    return finalKey;
}

// --- Example Usage ---
// To run this, you'd typically have a Node.js environment.

// console.log(createDomainKey()); // e.g., 's8F929eT6lXg1a2b' (if timestamp was full length)

// Test multiple times to see variation
// for (let i = 0; i < 5; i++) {
//     console.log(createDomainKey());
// }
```

###### dpw | 2025-07-10 | 81WKMfCmUsWs

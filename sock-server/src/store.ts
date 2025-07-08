
// CHANGE 1: Import the default export from 'iovalkey'. It's a class.
import Valkey from 'iovalkey';
import { config } from './config';

// CHANGE 2: Instantiate the client using 'new Valkey()'.
// iovalkey connects automatically, so no 'await .connect()' is needed.
const valkey = new Valkey({
  host: config.valkeyHost,
  port: config.valkeyPort,
  // iovalkey has great defaults, but you can add more options here
  // e.g., lazyConnect: true
});

// CHANGE 3: Add an error listener for robustness.
// This will catch background connection errors.
valkey.on('error', (err: Error) => console.error('Iovalkey Client Error:', err));

export const store = {
  async set(key: string, value: string): Promise<boolean> {
    const result = await valkey.set(key, value);
    // The 'set' command returns 'OK' on success.
    return result === 'OK';
  },

  async get(key: string): Promise<string | undefined> {
    const value = await valkey.get(key);
    return value === null ? undefined : value;
  },

  async delete(key: string): Promise<boolean> {
    const result = await valkey.del(key);
    // It returns the number of keys deleted.
    return result > 0;
  },

  async clear(): Promise<void> {
    await valkey.flushdb();
  },

  // The original iterator implementation works perfectly with iovalkey.
  async *iterator(): AsyncGenerator<[string, string]> {
    // Use a stream to fetch keys in batches automatically.
    const stream = valkey.scanStream({
      // Optional: match a pattern or change the batch size.
      count: 100 
    });

    for await (const keys of stream) {
      // 'keys' is an array of keys from a single SCAN batch.
      if ((keys as string[]).length > 0) {
        // Fetch all values for the batch of keys in a single command.
        const values = await valkey.mget(keys as string[]);
        for (let i = 0; i < (keys as string[]).length; i++) {
          // mget returns null for non-existent keys.
          if (values[i] !== null) {
            yield [(keys as string[])[i], values[i] as string];
          }
        }
      }
    }
  }
};
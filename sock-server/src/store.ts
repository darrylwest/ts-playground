
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
    // The 'get' command returns null if the key doesn't exist.
    return value === null ? undefined : value;
  },

  async delete(key: string): Promise<boolean> {
    // CHANGE 4: The 'del' command in iovalkey takes keys as separate arguments, not an array.
    const result = await valkey.del(key);
    // It returns the number of keys deleted.
    return result > 0;
  },

  async clear(): Promise<void> {
    await valkey.flushdb();
  },

  // The original iterator implementation works perfectly with iovalkey.
  async *iterator(): AsyncGenerator<[string, string]> {
    let cursor = 0; // iovalkey prefers a number for the cursor
    do {
      // The 'scan' command returns the next cursor and an array of keys.
      const [nextCursor, keys] = await valkey.scan(cursor);

      for (const key of keys) {
        const value = await valkey.get(key);
        if (value !== null) {
          yield [key, value];
        }
      }
      cursor = parseInt(nextCursor, 10);
    } while (cursor !== 0);
  },
};
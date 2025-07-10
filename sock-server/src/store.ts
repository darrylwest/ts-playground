import Valkey from 'iovalkey';
import { config } from './config';

const client = new Valkey({
  host: config.valkeyHost,
  port: config.valkeyPort,
});

client.on('error', (err: Error) => console.error('iovalkey Client Error:', err));

export const store = {
  async set(key: string, value: string): Promise<boolean> {
    const result = await client.set(key, value);
    return result === 'OK';
  },

  async get(key: string): Promise<string | undefined> {
    const value = await client.get(key);
    return value === null ? undefined : value;
  },

  async delete(key: string): Promise<boolean> {
    const result = await client.del(key);
    return result > 0;
  },

  async clear(): Promise<void> {
    await client.flushdb();
  },

  async ping(): Promise<string> {
    return await client.ping();
  },

  async dbsize(): Promise<string> {
    const value = await client.dbsize();
    return value.toString();
  },

  async keys(): Promise<string> {
    const value = await client.keys('*');
    return value.join(',');
  },

  async findKeys(pattern: string = '*'): Promise<string[]> {
    const foundKeys: string[] = [];
    let cursor = '0'; // Start the cursor at 0

    do {
      // The 'scan' command returns an array where:
      // - The first element is the new cursor for the next iteration.
      // - The second element is an array of keys found in this iteration.
      const [newCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      
      // Add the found keys to our results list
      foundKeys.push(...keys);
      
      // Update the cursor for the next loop
      cursor = newCursor;

    } while (cursor !== '0'); // Continue until the cursor is '0', indicating the scan is complete.

    return foundKeys;
  },

  async *iterator(): AsyncGenerator<[string, string]> {
    const stream = client.scanStream({
      count: 100
    });

    for await (const keys of stream) {
      if ((keys as string[]).length > 0) {
        const values = await client.mget(keys as string[]);
        for (let i = 0; i < (keys as string[]).length; i++) {
          if (values[i] !== null) {
            yield [(keys as string[])[i], values[i] as string];
          }
        }
      }
    }
  }
};

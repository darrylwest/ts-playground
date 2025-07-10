import Valkey from 'iovalkey';
import { config } from './config';

const valkey = new Valkey({
  host: config.valkeyHost,
  port: config.valkeyPort,
});

valkey.on('error', (err: Error) => console.error('Iovalkey Client Error:', err));

export const store = {
  async set(key: string, value: string): Promise<boolean> {
    const result = await valkey.set(key, value);
    return result === 'OK';
  },

  async get(key: string): Promise<string | undefined> {
    const value = await valkey.get(key);
    return value === null ? undefined : value;
  },

  async delete(key: string): Promise<boolean> {
    const result = await valkey.del(key);
    return result > 0;
  },

  async clear(): Promise<void> {
    await valkey.flushdb();
  },

  async ping(): Promise<string> {
    return await valkey.ping();
  },

  async dbsize(): Promise<string> {
    const value = await valkey.dbsize();
    return value.toString();
  },

  async keys(): Promise<string> {
    const value = await valkey.keys('*');
    return value.join(',');
  },

  async *iterator(): AsyncGenerator<[string, string]> {
    const stream = valkey.scanStream({
      count: 100 
    });

    for await (const keys of stream) {
      if ((keys as string[]).length > 0) {
        const values = await valkey.mget(keys as string[]);
        for (let i = 0; i < (keys as string[]).length; i++) {
          if (values[i] !== null) {
            yield [(keys as string[])[i], values[i] as string];
          }
        }
      }
    }
  }
};

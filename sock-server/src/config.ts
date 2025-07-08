import '@dotenvx/dotenvx/config';

export const config = {
  socketPath: process.env.SOCKET_PATH || '/tmp/kv-store.sock',
  valkeyHost: process.env.VALKEY_HOST || 'localhost',
  valkeyPort: parseInt(process.env.VALKEY_PORT || '6379', 10),
};

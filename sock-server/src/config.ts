import '@dotenvx/dotenvx/config';

export const config = {
  socketPath: process.env.SOCKET_PATH || '/tmp/kv-store.sock',
  dataPath: process.env.DATA_PATH || './data/kv-store.json',
};

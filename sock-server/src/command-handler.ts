import { version } from '../package.json';
import { store } from './store';
import { config } from './config';

export interface CommandResponse {
  response: string;
  closeConnection?: boolean;
  shutdownServer?: boolean;
}

export const handleCommand = async (data: Buffer): Promise<CommandResponse> => {
  const message = data.toString().trim();
  const [command, ...args] = message.split(' ');

  switch (command.toLowerCase()) {
    case 'ping':
      return { response: 'pong' };

    case 'version':
      return { response: `v${version}` };

    case 'set': {
      if (args.length < 2) {
        return { response: 'ERROR: "set" command requires a key and a value.' };
      }
      const [key, ...valueParts] = args;
      const value = valueParts.join(' ');
      const ok = await store.set(key, value);
      return { response: ok ? 'OK' : 'fail' };
    }

    case 'get': {
      if (args.length !== 1) {
        return { response: 'ERROR: "get" command requires a key.' };
      }
      const [key] = args;
      const value = await store.get(key);
      return { response: value === undefined ? '(nil)' : value };
    }

    case 'remove': {
      if (args.length !== 1) {
        return { response: 'ERROR: "remove" command requires a key.' };
      }
      const [key] = args;
      const wasDeleted = false; // await store.delete(key);
      return { response: wasDeleted ? '1' : '0' };
    }

    case 'dbsize': {
      // TODO store.size();
      return { response: 'DB Size: Unknown (iterator not supported)' };
    }

    case 'keys': {
      // TODO store.keys('*')
      return { response: 'Keys: Unknown (iterator not supported)' };
    }

    case 'save': {
      return { response: 'OK' };
    }

    case 'last': {
      return { response: 'Last: Unknown (iterator not supported)' };
    }

    case 'txkey': {
      return { response: `tx-${Date.now()}` };
    }

    case 'rtkey': {
      const randomString = Math.random().toString(36).substring(2, 15);
      return { response: `rt-${randomString}` };
    }

    case 'quit':
      return { response: 'BYE', closeConnection: true };

    case 'shutdown':
      return { response: 'Shutting down server...', shutdownServer: true };

    case 'status': {
      let dbSize = 0;
      for await (const [key, value] of store.iterator()) {
        dbSize++;
      }
      const uptime = process.uptime(); // in seconds
      const valkeyHost = config.valkeyHost;
      const valkeyPort = config.valkeyPort;
      return { response: `DB Size: ${dbSize}, Uptime: ${uptime.toFixed(2)}s, Valkey Host: ${valkeyHost}, Valkey Port: ${valkeyPort}` };
    }

    case 'help':
      return { response: `Available commands:\nquit - Close connection\nshutdown - Shut down server\nversion - Get server version\nping - Check server aliveness\nstatus - Get server status\nhelp - Display this help\nset <key> <value> - Set key/value\nget <key> - Get value by key\nremove <key> - Remove key/value\nlast <count> - Get last N key/value pairs\ndbsize - Get database size\nkeys - Get all keys\nsave - Save database (automatic for Valkey)\ntxkey - Generate timestamp key\nrtkey - Generate route key` };

    default:
      return { response: `Unknown command: ${command}` };
  }
};
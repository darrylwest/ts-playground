import { version } from '../package.json';
import { keyv } from './store';
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
      await keyv.set(key, value);
      return { response: 'OK' };
    }

    case 'get': {
      if (args.length !== 1) {
        return { response: 'ERROR: "get" command requires a key.' };
      }
      const [key] = args;
      const value = await keyv.get(key);
      return { response: value === undefined ? '(nil)' : value };
    }

    case 'remove': {
      if (args.length !== 1) {
        return { response: 'ERROR: "remove" command requires a key.' };
      }
      const [key] = args;
      const wasDeleted = await keyv.delete(key);
      return { response: wasDeleted ? '1' : '0' };
    }

    case 'dbsize': {
      // keyv.iterator() seems to be undefined for keyv-file.
      return { response: 'DB Size: Unknown (iterator not supported)' };
    }

    case 'keys': {
      // keyv.iterator() seems to be undefined for keyv-file.
      return { response: 'Keys: Unknown (iterator not supported)' };
    }

    case 'cleardb': {
      await keyv.clear();
      return { response: 'OK' };
    }

    case 'save': {
      // keyv-file automatically saves on set/delete.
      // This command is a no-op for keyv-file.
      return { response: 'OK' };
    }

    case 'last': {
      // keyv.iterator() seems to be undefined for keyv-file.
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
      // keyv.iterator() seems to be undefined for keyv-file.
      const uptime = process.uptime(); // in seconds
      const dataPath = config.dataPath;
      return { response: `DB Size: Unknown (iterator not supported), Uptime: ${uptime.toFixed(2)}s, Data File: ${dataPath}` };
    }

    case 'help':
      return { response: `Available commands:\nquit - Close connection\nshutdown - Shut down server\nversion - Get server version\nping - Check server aliveness\nstatus - Get server status\nhelp - Display this help\nset <key> <value> - Set key/value\nget <key> - Get value by key\nremove <key> - Remove key/value\nlast <count> - Get last N key/value pairs\ndbsize - Get database size\nkeys - Get all keys\ncleardb - Clear database\nsave - Save database (automatic for file store)\ntxkey - Generate timestamp key\nrtkey - Generate route key` };

    default:
      return { response: `Unknown command: ${command}` };
  }
};

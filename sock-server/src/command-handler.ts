import { version } from '../package.json';
import keyv from './store';

export const handleCommand = async (data: Buffer): Promise<string> => {
  const message = data.toString().trim();
  const [command, ...args] = message.split(' ');

  switch (command.toLowerCase()) {
    case 'ping':
      return 'pong';

    case 'version':
      return `v${version}`;

    case 'set': {
      if (args.length < 2) {
        return 'ERROR: "set" command requires a key and a value.';
      }
      const [key, ...valueParts] = args;
      const value = valueParts.join(' ');
      await keyv.set(key, value);
      return 'OK';
    }

    case 'get': {
      if (args.length !== 1) {
        return 'ERROR: "get" command requires a key.';
      }
      const [key] = args;
      const value = await keyv.get(key);
      return value === undefined ? '(nil)' : value;
    }

    case 'remove': {
      if (args.length !== 1) {
        return 'ERROR: "remove" command requires a key.';
      }
      const [key] = args;
      const wasDeleted = await keyv.delete(key);
      return wasDeleted ? '1' : '0';
    }

    default:
      return `Unknown command: ${command}`;
  }
};

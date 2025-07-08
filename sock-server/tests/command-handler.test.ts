import { handleCommand } from '../src/command-handler';
import { store } from '../src/store';

// Mock the store
jest.mock('../src/store', () => ({
  store: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    iterator: jest.fn(),
  },
}));

describe('Command Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should respond with pong for ping command', async () => {
    const response = await handleCommand(Buffer.from('ping'));
    expect(response.response).toBe('pong');
  });

  it('should return the correct version', async () => {
    const response = await handleCommand(Buffer.from('version'));
    // Assuming version is 1.0.0 from package.json
    expect(response.response).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  describe('set command', () => {
    it('should set a key-value pair and return OK', async () => {
      const key = 'testkey';
      const value = 'testvalue';
      const command = `set ${key} ${value}`;
      (store.set as jest.Mock).mockResolvedValue(true);

      const response = await handleCommand(Buffer.from(command));
      expect(store.set).toHaveBeenCalledWith(key, value);
      expect(response.response).toBe('OK');
    });

    it('should return an error if set command has too few arguments', async () => {
      const command = `set testkey`;
      const response = await handleCommand(Buffer.from(command));
      expect(store.set).not.toHaveBeenCalled();
      expect(response.response).toBe('ERROR: "set" command requires a key and a value.');
    });
  });

  describe('get command', () => {
    it('should get a value for a given key and return it', async () => {
      const key = 'testkey';
      const value = 'testvalue';
      const command = `get ${key}`;
      (store.get as jest.Mock).mockResolvedValue(value);

      const response = await handleCommand(Buffer.from(command));
      expect(store.get).toHaveBeenCalledWith(key);
      expect(response.response).toBe(value);
    });

    it('should return (nil) if key does not exist', async () => {
      const key = 'nonexistentkey';
      const command = `get ${key}`;
      (store.get as jest.Mock).mockResolvedValue(undefined);

      const response = await handleCommand(Buffer.from(command));
      expect(store.get).toHaveBeenCalledWith(key);
      expect(response.response).toBe('(nil)');
    });

    it('should return an error if get command has too few arguments', async () => {
      const command = `get`;
      const response = await handleCommand(Buffer.from(command));
      expect(store.get).not.toHaveBeenCalled();
      expect(response.response).toBe('ERROR: "get" command requires a key.');
    });
  });

  describe('remove command', () => {
    it('should remove a key-value pair and return 1', async () => {
      const key = 'testkey';
      const command = `remove ${key}`;
      (store.delete as jest.Mock).mockResolvedValue(true);

      const response = await handleCommand(Buffer.from(command));
      expect(store.delete).toHaveBeenCalledWith(key);
      expect(response.response).toBe('1');
    });

    it('should return 0 if key does not exist', async () => {
      const key = 'nonexistentkey';
      const command = `remove ${key}`;
      (store.delete as jest.Mock).mockResolvedValue(false);

      const response = await handleCommand(Buffer.from(command));
      expect(store.delete).toHaveBeenCalledWith(key);
      expect(response.response).toBe('0');
    });

    it('should return an error if remove command has too few arguments', async () => {
      const command = `remove`;
      const response = await handleCommand(Buffer.from(command));
      expect(store.delete).not.toHaveBeenCalled();
      expect(response.response).toBe('ERROR: "remove" command requires a key.');
    });
  });

  describe('cleardb command', () => {
    it('should clear the database and return OK', async () => {
      const command = `cleardb`;
      (store.clear as jest.Mock).mockResolvedValue(undefined);

      const response = await handleCommand(Buffer.from(command));
      expect(store.clear).toHaveBeenCalled();
      expect(response.response).toBe('OK');
    });
  });

  describe('dbsize command', () => {
    it('should return the correct database size', async () => {
      (store.iterator as jest.Mock).mockImplementation(async function* () {
        yield ['key1', 'value1'];
        yield ['key2', 'value2'];
        yield ['key3', 'value3'];
      });
      const response = await handleCommand(Buffer.from('dbsize'));
      expect(response.response).toBe('3');
    });
  });

  describe('keys command', () => {
    it('should return a list of all keys', async () => {
      (store.iterator as jest.Mock).mockImplementation(async function* () {
        yield ['key1', 'value1'];
        yield ['key2', 'value2'];
      });
      const response = await handleCommand(Buffer.from('keys'));
      expect(response.response).toBe('key1 key2');
    });
  });

  describe('last command', () => {
    it('should return the last N key/value pairs', async () => {
      (store.iterator as jest.Mock).mockImplementation(async function* () {
        yield ['key1', 'value1'];
        yield ['key2', 'value2'];
        yield ['key3', 'value3'];
      });
      const response = await handleCommand(Buffer.from('last 2'));
      expect(response.response).toBe('key2:value2 key3:value3');
    });

    it('should return an error if count is not a number', async () => {
      const response = await handleCommand(Buffer.from('last abc'));
      expect(response.response).toBe('ERROR: "last" command requires a positive number for count.');
    });

    it('should return an error if count is negative', async () => {
      const response = await handleCommand(Buffer.from('last -1'));
      expect(response.response).toBe('ERROR: "last" command requires a positive number for count.');
    });
  });

  describe('save command', () => {
    it('should return OK', async () => {
      const response = await handleCommand(Buffer.from('save'));
      expect(response.response).toBe('OK');
    });
  });
});

import { handleCommand } from '../src/command-handler';
import { keyv } from '../src/store';

// Mock keyv
jest.mock('../src/store', () => ({
  keyv: {
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

  describe('txkey command', () => {
    it('should generate a timestamp-based key', async () => {
      const mockDateNow = 1678886400000; // A fixed timestamp
      jest.spyOn(Date, 'now').mockReturnValue(mockDateNow);
      const response = await handleCommand(Buffer.from('txkey'));
      expect(response.response).toBe(`tx-${mockDateNow}`);
    });
  });

  describe('rtkey command', () => {
    it('should generate a route-based key', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.123456789); // A fixed random number
      const response = await handleCommand(Buffer.from('rtkey'));
      expect(response.response).toBe(`rt-4fzzzxjylrx`); // Based on the mocked random value
    });
  });

  describe('quit command', () => {
    it('should return BYE and set closeConnection to true', async () => {
      const response = await handleCommand(Buffer.from('quit'));
      expect(response.response).toBe('BYE');
      expect(response.closeConnection).toBe(true);
    });
  });

  describe('shutdown command', () => {
    it('should return Shutting down server... and set shutdownServer to true', async () => {
      const response = await handleCommand(Buffer.from('shutdown'));
      expect(response.response).toBe('Shutting down server...');
      expect(response.shutdownServer).toBe(true);
    });
  });

  describe('status command', () => {
    it('should return status information', async () => {
      jest.spyOn(process, 'uptime').mockReturnValue(123.456);
      // Mock config.dataPath if needed, but for now, it's a string literal in command-handler
      const response = await handleCommand(Buffer.from('status'));
      expect(response.response).toMatch(/^DB Size: Unknown \(iterator not supported\), Uptime: \d+\.\d{2}s, Data File: .*/);
    });
  });

  describe('help command', () => {
    it('should return the help text', async () => {
      const response = await handleCommand(Buffer.from('help'));
      expect(response.response).toContain('Available commands:');
      expect(response.response).toContain('quit - Close connection');
      expect(response.response).toContain('set <key> <value> - Set key/value');
    });
  });

  describe('set command', () => {
    it('should set a key-value pair and return OK', async () => {
      const key = 'testkey';
      const value = 'testvalue';
      const command = `set ${key} ${value}`;
      (keyv.set as jest.Mock).mockResolvedValue(true);

      const response = await handleCommand(Buffer.from(command));
      expect(keyv.set).toHaveBeenCalledWith(key, value);
      expect(response.response).toBe('OK');
    });

    it('should return an error if set command has too few arguments', async () => {
      const command = `set testkey`;
      const response = await handleCommand(Buffer.from(command));
      expect(keyv.set).not.toHaveBeenCalled();
      expect(response.response).toBe('ERROR: "set" command requires a key and a value.');
    });
  });

  describe('get command', () => {
    it('should get a value for a given key and return it', async () => {
      const key = 'testkey';
      const value = 'testvalue';
      const command = `get ${key}`;
      (keyv.get as jest.Mock).mockResolvedValue(value);

      const response = await handleCommand(Buffer.from(command));
      expect(keyv.get).toHaveBeenCalledWith(key);
      expect(response.response).toBe(value);
    });

    it('should return (nil) if key does not exist', async () => {
      const key = 'nonexistentkey';
      const command = `get ${key}`;
      (keyv.get as jest.Mock).mockResolvedValue(undefined);

      const response = await handleCommand(Buffer.from(command));
      expect(keyv.get).toHaveBeenCalledWith(key);
      expect(response.response).toBe('(nil)');
    });

    it('should return an error if get command has too few arguments', async () => {
      const command = `get`;
      const response = await handleCommand(Buffer.from(command));
      expect(keyv.get).not.toHaveBeenCalled();
      expect(response.response).toBe('ERROR: "get" command requires a key.');
    });
  });

  describe('remove command', () => {
    it('should remove a key-value pair and return 1', async () => {
      const key = 'testkey';
      const command = `remove ${key}`;
      (keyv.delete as jest.Mock).mockResolvedValue(true);

      const response = await handleCommand(Buffer.from(command));
      expect(keyv.delete).toHaveBeenCalledWith(key);
      expect(response.response).toBe('1');
    });

    it('should return 0 if key does not exist', async () => {
      const key = 'nonexistentkey';
      const command = `remove ${key}`;
      (keyv.delete as jest.Mock).mockResolvedValue(false);

      const response = await handleCommand(Buffer.from(command));
      expect(keyv.delete).toHaveBeenCalledWith(key);
      expect(response.response).toBe('0');
    });

    it('should return an error if remove command has too few arguments', async () => {
      const command = `remove`;
      const response = await handleCommand(Buffer.from(command));
      expect(keyv.delete).not.toHaveBeenCalled();
      expect(response.response).toBe('ERROR: "remove" command requires a key.');
    });
  });

  describe('cleardb command', () => {
    it('should clear the database and return OK', async () => {
      const command = `cleardb`;
      (keyv.clear as jest.Mock).mockResolvedValue(undefined);

      const response = await handleCommand(Buffer.from(command));
      expect(keyv.clear).toHaveBeenCalled();
      expect(response.response).toBe('OK');
    });
  });
});
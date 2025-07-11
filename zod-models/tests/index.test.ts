import { loadAndParseContacts, loadAndParseUsers } from '../src/index';
import { ContactMap, UserMap } from '../src/models';
import { promises as fs } from 'fs';

// Mock the fs.readFile function
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('File Loading and Parsing', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadAndParseContacts', () => {
    it('should load and parse contacts from a JSON file', async () => {
      const mockContactData = {
        'con:contact12345': {
          key: 'con:contact12345',
          dateCreated: 1625097600000,
          lastUpdated: 1625097600000,
          version: 1,
          status: 'active',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          ip_address: '192.168.1.1',
          details: {
            department: 'Sales',
          },
        },
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockContactData));

      const contacts = await loadAndParseContacts('dummy/path/contacts.json');
      
      const expectedContact = {
        ...mockContactData['con:contact12345'],
        details: new Map(Object.entries(mockContactData['con:contact12345'].details)),
      };

      expect(contacts).toBeInstanceOf(Map);
      expect(contacts.size).toBe(1);
      expect(contacts.get('con:contact12345')).toEqual(expectedContact);
      expect(() => ContactMap.parse(contacts)).not.toThrow();
    });

    it('should throw an error for invalid contact data', async () => {
      const mockInvalidData = {
        'contact1': { email: 'not-an-email' }, // Invalid data
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockInvalidData));

      await expect(loadAndParseContacts('dummy/path/invalid.json')).rejects.toThrow();
    });
  });

  describe('loadAndParseUsers', () => {
    it('should load and parse users from a JSON file', async () => {
      const mockUserData = {
        'usr:user12345678': {
          key: 'usr:user12345678',
          dateCreated: 1625097600000,
          lastUpdated: 1625097600000,
          version: 1,
          status: 'active',
          email: 'jane.doe@example.com',
          ip_address: '192.168.1.2',
          roles: 'admin',
          preferences: {
            theme: 'dark',
          },
        },
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockUserData));

      const users = await loadAndParseUsers('dummy/path/users.json');

      const expectedUser = {
        ...mockUserData['usr:user12345678'],
        preferences: new Map(Object.entries(mockUserData['usr:user12345678'].preferences)),
      };

      expect(users).toBeInstanceOf(Map);
      expect(users.size).toBe(1);
      expect(users.get('usr:user12345678')).toEqual(expectedUser);
      expect(() => UserMap.parse(users)).not.toThrow();
    });

    it('should throw an error for invalid user data', async () => {
      const mockInvalidData = {
        'user1': { roles: 'admin' }, // Missing required fields
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockInvalidData));

      await expect(loadAndParseUsers('dummy/path/invalid.json')).rejects.toThrow();
    });
  });
});
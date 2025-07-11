import { loadAndParseContacts, loadAndParseUsers } from '../src/index';
import { ContactMap, UserMap } from '../src/models';

describe('Data Loading from test-data', () => {
  describe('loadAndParseContacts', () => {
    it('should load and parse contacts from test-data/contacts.json', async () => {
      const contacts = await loadAndParseContacts('test-data/contacts.json');
      expect(contacts).toBeInstanceOf(Map);
      expect(contacts.size).toBeGreaterThan(0);
      expect(() => ContactMap.parse(contacts)).not.toThrow();
    });
  });

  describe('loadAndParseUsers', () => {
    it('should load and parse users from test-data/users.json', async () => {
      const users = await loadAndParseUsers('test-data/users.json');
      expect(users).toBeInstanceOf(Map);
      expect(users.size).toBeGreaterThan(0);
      expect(() => UserMap.parse(users)).not.toThrow();
    });
  });
});

import {
  BaseSchema,
  ContactSchema,
  UserSchema,
  AddressSchema,
  ContactMap,
  UserMap,
  BaseStatus
} from '../src/models';
import { createRouteKey } from '../src/txkey';

describe('BaseSchema', () => {
  it('should validate correct base data', async () => {
    const validBase = {
      key: await createRouteKey('pub'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active
    };

    const result = BaseSchema.parse(validBase);
    expect(result).toEqual(validBase);
  });

  // The key length is no longer strictly 12 for BaseSchema, so this test is removed.
  // Specific key length and prefix validation will be handled by ContactSchema and UserSchema.

  it('should reject invalid status', async () => {
    const invalidBase = {
      key: await createRouteKey('pub'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: "invalid_status"
    };

    expect(() => BaseSchema.parse(invalidBase)).toThrow();
  });
});

describe('AddressSchema', () => {
  it('should validate complete address', () => {
    const validAddress = {
      addr1: "123 Main St",
      addr2: "Apt 4B",
      city: "Anytown",
      state: "CA",
      zip: "12345",
      latlng: [ 37.7749, -122.4194 ], // [latitude, longitude]
    };

    const result = AddressSchema.parse(validAddress);
    expect(result).toEqual(validAddress);
  });

  it('should validate minimal address', () => {
    const minimalAddress = {
      addr1: "123 Main St",
      city: "Anytown",
      state: "CA",
      zip: "12345"
    };

    const result = AddressSchema.parse(minimalAddress);
    expect(result).toEqual(minimalAddress);
  });

  it('should reject missing required fields', () => {
    const invalidAddress = {
      addr1: "123 Main St",
      city: "Anytown"
      // missing state and zip
    };

    expect(() => AddressSchema.parse(invalidAddress)).toThrow();
  });
});

describe('ContactSchema', () => {
  it('should validate complete contact', async () => {
    const validContact = {
      key: await createRouteKey('con'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      phone: "555-1234",
      ip_address: "192.168.1.1",
      details: new Map([["department", "Engineering"]])
    };

    const result = ContactSchema.parse(validContact);
    expect(result).toEqual(validContact);
  });

  it('should validate minimal contact', async () => {
    const minimalContact = {
      key: await createRouteKey('con'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.New,
      email: "test@example.com",
      ip_address: "10.0.0.1"
    };

    const result = ContactSchema.parse(minimalContact);
    expect(result).toEqual(minimalContact);
  });

  it('should reject invalid email', async () => {
    const invalidContact = {
      key: await createRouteKey('con'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "invalid-email",
      ip_address: "192.168.1.1"
    };

    expect(() => ContactSchema.parse(invalidContact)).toThrow();
  });

  it('should accept any IP address string', async () => {
    const validContact = {
      key: await createRouteKey('con'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "test@example.com",
      ip_address: "192.168.1.1"
    };

    const result = ContactSchema.parse(validContact);
    expect(result).toEqual(validContact);
  });

  it('should reject key with wrong prefix', async () => {
    const invalidContact = {
      key: await createRouteKey('bad'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "test@example.com",
      ip_address: "192.168.1.1"
    };
    expect(() => ContactSchema.parse(invalidContact)).toThrow();
  });

  it('should reject key with incorrect length', async () => {
    const invalidContact = {
      key: 'con:short',
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "test@example.com",
      ip_address: "192.168.1.1"
    };
    expect(() => ContactSchema.parse(invalidContact)).toThrow();
  });
});

describe('UserSchema', () => {
  it('should validate complete user', async () => {
    const validUser = {
      key: await createRouteKey('usr'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      first_name: "Alice",
      last_name: "Johnson",
      email: "alice@example.com",
      phone: "555-5678",
      ip_address: "172.16.0.1",
      roles: "admin,user",
      company_name: "Tech Corp",
      preferences: new Map([["theme", "dark"]]),
      addresses: [
        {
          addr1: "123 Main St",
          city: "Anytown",
          state: "CA",
          zip: "12345"
        }
      ]
    };

    const result = UserSchema.parse(validUser);
    expect(result).toEqual(validUser);
  });

  it('should validate minimal user', async () => {
    const minimalUser = {
      key: await createRouteKey('usr'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.New,
      email: "user@example.com",
      ip_address: "10.0.0.1",
      roles: "user"
    };

    const result = UserSchema.parse(minimalUser);
    expect(result).toEqual(minimalUser);
  });

  it('should reject missing roles', async () => {
    const invalidUser = {
      key: await createRouteKey('usr'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "test@example.com",
      ip_address: "192.168.1.1"
      // missing roles
    };

    expect(() => UserSchema.parse(invalidUser)).toThrow();
  });

  it('should reject key with wrong prefix', async () => {
    const invalidUser = {
      key: await createRouteKey('bad'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "test@example.com",
      ip_address: "192.168.1.1",
      roles: "user"
    };
    expect(() => UserSchema.parse(invalidUser)).toThrow();
  });

  it('should reject key with incorrect length', async () => {
    const invalidUser = {
      key: 'usr:short',
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "test@example.com",
      ip_address: "192.168.1.1",
      roles: "user"
    };
    expect(() => UserSchema.parse(invalidUser)).toThrow();
  });
});

describe('ContactMap', () => {
  it('should validate map of contacts', async () => {
    const contacts = new Map();
    const contact = {
      key: await createRouteKey('con'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "test@example.com",
      ip_address: "192.168.1.1"
    };
    
    contacts.set(contact.key, contact);
    
    const result = ContactMap.parse(contacts);
    expect(result).toEqual(contacts);
  });

  it('should reject invalid contact in map', async () => {
    const contacts = new Map();
    const invalidContact = {
      key: await createRouteKey('bad'), // Invalid prefix
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "invalid-email",
      ip_address: "192.168.1.1"
    };
    
    contacts.set(invalidContact.key, invalidContact);
    
    expect(() => ContactMap.parse(contacts)).toThrow();
  });
});

describe('UserMap', () => {
  it('should validate map of users', async () => {
    const users = new Map();
    const user = {
      key: await createRouteKey('usr'),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "test@example.com",
      ip_address: "192.168.1.1",
      roles: "user"
    };
    
    users.set(user.key, user);
    
    const result = UserMap.parse(users);
    expect(result).toEqual(users);
  });

  it('should reject invalid user in map', async () => {
    const users = new Map();
    const invalidUser = {
      key: await createRouteKey('bad'), // Invalid prefix
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "test@example.com",
      ip_address: "192.168.1.1",
      roles: "user"
    };
    
    users.set(invalidUser.key, invalidUser);
    
    expect(() => UserMap.parse(users)).toThrow();
  });
});
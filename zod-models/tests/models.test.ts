import { 
  createTxKey, 
  BaseSchema, 
  ContactSchema, 
  UserSchema, 
  AddressSchema,
  ContactMap,
  UserMap
} from '../src/models';

// Mock enum for testing
enum BaseStatus {
  New = "new",
  Pending = "pending",
  Active = "active",
  Inactive = "inactive",
  Verified = "verified",
  Deleted = "deleted",
  Shipped = "shipped",
  Completed = "completed",
}

describe('createTxKey', () => {
  it('should create a 12-character key', () => {
    const key = createTxKey();
    expect(key).toHaveLength(12);
    expect(typeof key).toBe('string');
  });

  it('should create unique keys', () => {
    const key1 = createTxKey();
    const key2 = createTxKey();
    expect(key1).not.toBe(key2);
  });
});

describe('BaseSchema', () => {
  it('should validate correct base data', () => {
    const validBase = {
      key: createTxKey(),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active
    };

    const result = BaseSchema.parse(validBase);
    expect(result).toEqual(validBase);
  });

  it('should reject invalid key length', () => {
    const invalidBase = {
      key: "short",
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active
    };

    expect(() => BaseSchema.parse(invalidBase)).toThrow();
  });

  it('should reject invalid status', () => {
    const invalidBase = {
      key: createTxKey(),
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
      latitude: 37.7749,
      longitude: -122.4194
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
  it('should validate complete contact', () => {
    const validContact = {
      key: createTxKey(),
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

  it('should validate minimal contact', () => {
    const minimalContact = {
      key: createTxKey(),
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

  it('should reject invalid email', () => {
    const invalidContact = {
      key: createTxKey(),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "invalid-email",
      ip_address: "192.168.1.1"
    };

    expect(() => ContactSchema.parse(invalidContact)).toThrow();
  });

  it('should accept any IP address string', () => {
    const validContact = {
      key: createTxKey(),
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
});

describe('UserSchema', () => {
  it('should validate complete user', () => {
    const validUser = {
      key: createTxKey(),
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

  it('should validate minimal user', () => {
    const minimalUser = {
      key: createTxKey(),
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

  it('should reject missing roles', () => {
    const invalidUser = {
      key: createTxKey(),
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
});

describe('ContactMap', () => {
  it('should validate map of contacts', () => {
    const contacts = new Map();
    const contact = {
      key: createTxKey(),
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

  it('should reject invalid contact in map', () => {
    const contacts = new Map();
    const invalidContact = {
      key: createTxKey(),
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
  it('should validate map of users', () => {
    const users = new Map();
    const user = {
      key: createTxKey(),
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

  it('should reject invalid user in map', () => {
    const users = new Map();
    const invalidUser = {
      key: createTxKey(),
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 1,
      status: BaseStatus.Active,
      email: "test@example.com",
      ip_address: "192.168.1.1"
      // missing roles
    };
    
    users.set(invalidUser.key, invalidUser);
    
    expect(() => UserMap.parse(users)).toThrow();
  });
});
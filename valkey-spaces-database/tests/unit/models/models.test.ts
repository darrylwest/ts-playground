import { 
  BaseStatus, 
  BaseSchema, 
  PersonSchema, 
  UserSchema, 
  ContactSchema, 
  AddressSchema 
} from '../../../src/models/index';

describe('Data Models', () => {
  describe('BaseStatus Enum', () => {
    it('should contain all expected status values', () => {
      const expectedStatuses = [
        'new', 'pending', 'active', 'inactive', 
        'verified', 'deleted', 'shipped', 'completed'
      ];
      
      const actualStatuses = Object.values(BaseStatus);
      expect(actualStatuses).toEqual(expectedStatuses);
    });
  });

  describe('BaseSchema', () => {
    const validBaseData = {
      key: 'usr:abc123DEF456',
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 0,
      status: BaseStatus.New,
    };

    it('should validate correct base data', () => {
      const result = BaseSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
    });

    it('should require all base fields', () => {
      const result = BaseSchema.safeParse({});
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const fieldErrors = result.error.errors.map(err => err.path[0]);
        expect(fieldErrors).toContain('key');
        expect(fieldErrors).toContain('dateCreated');
        expect(fieldErrors).toContain('lastUpdated');
        expect(fieldErrors).toContain('version');
        expect(fieldErrors).toContain('status');
      }
    });

    it('should validate key length', () => {
      const result = BaseSchema.safeParse({
        ...validBaseData,
        key: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('should validate version is non-negative', () => {
      const result = BaseSchema.safeParse({
        ...validBaseData,
        version: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AddressSchema', () => {
    const validAddressData = {
      addr1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
    };

    it('should validate correct address data', () => {
      const result = AddressSchema.safeParse(validAddressData);
      expect(result.success).toBe(true);
    });

    it('should allow optional fields', () => {
      const result = AddressSchema.safeParse({
        ...validAddressData,
        addr2: 'Apt 4B',
        addr3: 'Building C',
        latlng: [37.7749, -122.4194],
      });
      expect(result.success).toBe(true);
    });

    it('should require mandatory address fields', () => {
      const result = AddressSchema.safeParse({});
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const fieldErrors = result.error.errors.map(err => err.path[0]);
        expect(fieldErrors).toContain('addr1');
        expect(fieldErrors).toContain('city');
        expect(fieldErrors).toContain('state');
        expect(fieldErrors).toContain('zip');
      }
    });

    it('should validate latlng tuple format', () => {
      const result = AddressSchema.safeParse({
        ...validAddressData,
        latlng: [37.7749], // Invalid - should be tuple of 2 numbers
      });
      expect(result.success).toBe(false);
    });
  });

  describe('PersonSchema', () => {
    const validPersonData = {
      key: 'usr:abc123DEF456',
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 0,
      status: BaseStatus.Active,
      email: 'john.doe@example.com',
      ip_address: '192.168.1.1',
    };

    it('should validate correct person data', () => {
      const result = PersonSchema.safeParse(validPersonData);
      expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
      const result = PersonSchema.safeParse({
        ...validPersonData,
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });

    it('should allow optional person fields', () => {
      const result = PersonSchema.safeParse({
        ...validPersonData,
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1-555-123-4567',
        details: new Map([['notes', 'test user']]),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UserSchema', () => {
    const validUserData = {
      key: 'usr:abc123DEF456',
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 0,
      status: BaseStatus.Active,
      email: 'john.doe@example.com',
      ip_address: '192.168.1.1',
      roles: 'user',
    };

    it('should validate correct user data', () => {
      const result = UserSchema.safeParse(validUserData);
      expect(result.success).toBe(true);
    });

    it('should enforce user key prefix', () => {
      const result = UserSchema.safeParse({
        ...validUserData,
        key: 'con:abc123DEF456', // Wrong prefix
      });
      expect(result.success).toBe(false);
    });

    it('should allow optional user fields', () => {
      const result = UserSchema.safeParse({
        ...validUserData,
        first_name: 'John',
        last_name: 'Doe',
        company_name: 'Test Corp',
        preferences: new Map([['theme', 'dark']]),
        addresses: [{
          addr1: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip: '12345',
        }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('ContactSchema', () => {
    const validContactData = {
      key: 'con:abc123DEF456',
      dateCreated: Date.now(),
      lastUpdated: Date.now(),
      version: 0,
      status: BaseStatus.Active,
      email: 'contact@example.com',
      ip_address: '192.168.1.1',
    };

    it('should validate correct contact data', () => {
      const result = ContactSchema.safeParse(validContactData);
      expect(result.success).toBe(true);
    });

    it('should enforce contact key prefix', () => {
      const result = ContactSchema.safeParse({
        ...validContactData,
        key: 'usr:abc123DEF456', // Wrong prefix
      });
      expect(result.success).toBe(false);
    });
  });
});
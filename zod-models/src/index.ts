import { z } from 'zod';
import { promises as fs } from 'fs';
import { 
  createTxKey, 
  ContactSchema, 
  UserSchema, 
  ContactMap, 
  UserMap,
  BaseStatus 
} from './models';

async function createSampleData() {
  // Create sample contacts
  const contacts = new Map();
  
  const contact1 = ContactSchema.parse({
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
    details: new Map([["department", "Engineering"], ["location", "Seattle"]])
  });
  
  const contact2 = ContactSchema.parse({
    key: createTxKey(),
    dateCreated: Date.now(),
    lastUpdated: Date.now(),
    version: 1,
    status: BaseStatus.Verified,
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@example.com",
    ip_address: "10.0.0.1"
  });
  
  contacts.set(contact1.key, contact1);
  contacts.set(contact2.key, contact2);
  
  // Create sample users
  const users = new Map();
  
  const user1 = UserSchema.parse({
    key: createTxKey(),
    dateCreated: Date.now(),
    lastUpdated: Date.now(),
    version: 1,
    status: BaseStatus.Active,
    first_name: "Alice",
    last_name: "Johnson",
    email: "alice.johnson@company.com",
    phone: "555-5678",
    ip_address: "172.16.0.1",
    roles: "admin,user",
    company_name: "Tech Corp",
    preferences: new Map([["theme", "dark"], ["notifications", "enabled"]]),
    addresses: [
      {
        addr1: "123 Main St",
        city: "Anytown",
        state: "CA",
        zip: "12345",
        latlng: [37.7749, -122.4194]
      }
    ]
  });
  
  const user2 = UserSchema.parse({
    key: createTxKey(),
    dateCreated: Date.now(),
    lastUpdated: Date.now(),
    version: 1,
    status: BaseStatus.New,
    email: "bob.wilson@company.com",
    ip_address: "192.168.0.10",
    roles: "user",
    company_name: "StartupXYZ"
  });
  
  users.set(user1.key, user1);
  users.set(user2.key, user2);
  
  // Validate the maps with Zod schemas
  const validatedContacts = ContactMap.parse(contacts);
  const validatedUsers = UserMap.parse(users);
  
  return { contacts: validatedContacts, users: validatedUsers };
}

async function persistData(contacts: Map<string, any>, users: Map<string, any>) {
  try {
    // Convert Maps to Objects for JSON serialization
    const contactsObj = Object.fromEntries(
      Array.from(contacts.entries()).map(([key, value]) => [
        key, 
        {
          ...value,
          details: value.details ? Object.fromEntries(value.details) : undefined
        }
      ])
    );
    
    const usersObj = Object.fromEntries(
      Array.from(users.entries()).map(([key, value]) => [
        key,
        {
          ...value,
          preferences: value.preferences ? Object.fromEntries(value.preferences) : undefined
        }
      ])
    );
    
    // Write to JSON files
    await fs.writeFile('contacts.json', JSON.stringify(contactsObj, null, 2));
    await fs.writeFile('users.json', JSON.stringify(usersObj, null, 2));
    
    console.log('Data successfully written to contacts.json and users.json');
    console.log(`Contacts: ${contacts.size} records`);
    console.log(`Users: ${users.size} records`);
    
  } catch (error) {
    console.error('Error persisting data:', error);
  }
}

export async function loadAndParseContacts(filePath: string): Promise<z.infer<typeof ContactMap>> {
  const data = await fs.readFile(filePath, 'utf-8');
  const parsedJson = JSON.parse(data);

  const contactMap = new Map();
  for (const key in parsedJson) {
    if (Object.prototype.hasOwnProperty.call(parsedJson, key)) {
      const contactData = parsedJson[key];
      if (contactData.details) {
        contactData.details = new Map(Object.entries(contactData.details));
      }
      contactMap.set(key, contactData);
    }
  }
  return ContactMap.parse(contactMap);
}

export async function loadAndParseUsers(filePath: string): Promise<z.infer<typeof UserMap>> {
  const data = await fs.readFile(filePath, 'utf-8');
  const parsedJson = JSON.parse(data);

  const userMap = new Map();
  for (const key in parsedJson) {
    if (Object.prototype.hasOwnProperty.call(parsedJson, key)) {
      const userData = parsedJson[key];
      if (userData.preferences) {
        userData.preferences = new Map(Object.entries(userData.preferences));
      }
      userMap.set(key, userData);
    }
  }
  return UserMap.parse(userMap);
}

async function main() {
  try {
    console.log('Loading and parsing data from disk...');
    const contacts = await loadAndParseContacts('data/contacts.json');
    const users = await loadAndParseUsers('data/users.json');

    console.log('Data successfully loaded and parsed:');
    console.log(`Contacts: ${contacts.size} records`);
    console.log(contacts);
    console.log(`Users: ${users.size} records`);
    console.log(users);
    
    console.log('Demo completed successfully!');
  } catch (error) {
    console.error('Error in main:', error);
  }
}

// Run the demo only if the script is executed directly
if (require.main === module) {
  main();
}
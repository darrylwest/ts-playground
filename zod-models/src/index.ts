import { z } from 'zod';
import { promises as fs } from 'fs';
import { 
  ContactMap, 
  UserMap,
} from './models';

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
    
  } catch (error) {
    console.error('Error in main:', error);
  }
}

// Run the demo only if the script is executed directly
if (require.main === module) {
  main();
}
import { promises as fs } from 'fs';
import { ContactSchema, BaseStatus } from '../src/models';
import { createTxKey } from '../src/txkey';
import { z } from 'zod';

const statuses = Object.values(BaseStatus);

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateRandomContact(): Promise<z.infer<typeof ContactSchema>> {
  const key = await createTxKey();
  const now = Date.now();
  const firstName = `FirstName${Math.random().toString(36).substring(2, 7)}`;
  const lastName = `LastName${Math.random().toString(36).substring(2, 7)}`;

  const contact = {
    key,
    dateCreated: now,
    lastUpdated: now,
    version: 1,
    status: getRandomElement(statuses),
    first_name: firstName,
    last_name: lastName,
    email: `${firstName}.${lastName}@example.com`,
    phone: `555-${Math.random().toString().substring(2, 6)}`,
    ip_address: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
    details: new Map([['source', 'random'], ['generated', new Date().toISOString()]]),
  };

  return ContactSchema.parse(contact);
}

async function generateAndSaveContacts(count: number, filePath: string) {
  const contacts: { [key: string]: any } = {};

  for (let i = 0; i < count; i++) {
    const contact = await generateRandomContact();
    contacts[contact.key] = {
      ...contact,
      details: contact.details ? Object.fromEntries(contact.details) : undefined,
    };
  }

  try {
    await fs.writeFile(filePath, JSON.stringify(contacts, null, 2));
    console.log(`Successfully generated and saved ${count} contacts to ${filePath}`);
  } catch (error) {
    console.error(`Error saving contacts to ${filePath}:`, error);
  }
}

// Generate 25 contacts and save to data/contacts.json
generateAndSaveContacts(25, 'data/contacts.json');

import { promises as fs } from 'fs';
import { UserSchema, AddressSchema, BaseStatus } from '../src/models';
import { createRouteKey } from '../src/txkey';
import { createTxKey } from '../src/txkey';
import { z } from 'zod';

const statuses = Object.values(BaseStatus);
const roles = ['admin', 'user', 'editor', 'viewer'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomAddress(): z.infer<typeof AddressSchema> {
  const address = {
    addr1: `${Math.floor(Math.random() * 1000) + 1} Main St`,
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    latlng: [Number((Math.random() * 180 - 90).toFixed(4)), Number((Math.random() * 360 - 180).toFixed(4))] as [number, number],
  };
  return AddressSchema.parse(address);
}

async function generateRandomUser(): Promise<z.infer<typeof UserSchema>> {
  const key = await createRouteKey('usr');
  const now = Date.now();
  const firstName = `UserFirstName${Math.random().toString(36).substring(2, 7)}`;
  const lastName = `UserLastName${Math.random().toString(36).substring(2, 7)}`;

  const user = {
    key,
    dateCreated: now,
    lastUpdated: now,
    version: 1,
    status: getRandomElement(statuses),
    first_name: firstName,
    last_name: lastName,
    email: `${firstName}.${lastName}@example.com`,
    phone: `555-${Math.random().toString().substring(2, 6)}`,
    ip_address: `10.0.0.${Math.floor(Math.random() * 254) + 1}`,
    roles: getRandomElement(roles),
    company_name: `Company${Math.random().toString(36).substring(2, 9)}`,
    preferences: new Map([['theme', getRandomElement(['dark', 'light'])], ['notifications', 'enabled']]),
    addresses: [generateRandomAddress()],
  };

  return UserSchema.parse(user);
}

async function generateAndSaveUsers(count: number, filePath: string) {
  const users: { [key: string]: any } = {};

  for (let i = 0; i < count; i++) {
    const user = await generateRandomUser();
    users[user.key] = {
      ...user,
      preferences: user.preferences ? Object.fromEntries(user.preferences) : undefined,
    };
  }

  try {
    await fs.writeFile(filePath, JSON.stringify(users, null, 2));
    console.log(`Successfully generated and saved ${count} users to ${filePath}`);
  } catch (error) {
    console.error(`Error saving users to ${filePath}:`, error);
  }
}

// Generate 25 users and save to data/users.json
generateAndSaveUsers(25, 'data/users.json');

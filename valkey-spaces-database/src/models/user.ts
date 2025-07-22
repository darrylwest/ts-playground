import { z } from 'zod';
import { PersonSchema } from './person.js';
import { AddressSchema } from './address.js';

export const UserSchema = PersonSchema.extend({
  key: z.string().length(16).startsWith('usr:'),
  roles: z.string(), // the roles that this user is authorized for
  preferences: z.map(z.string(), z.string()).optional(), // specific preference settings
  company_name: z.string().optional(), // optional name of the company affiliation
  addresses: z.array(AddressSchema).optional(), // array of addresses (home, work, billing, etc.)
});

export type User = z.infer<typeof UserSchema>;

// Zod map schema for data storage  
export const UserMap = z.map(z.string(), UserSchema);
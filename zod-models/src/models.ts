import { z } from 'zod';

/*
export function createTxKey(): string {
  const key = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
  return key.substring(0, 12);
}
*/

export enum BaseStatus {
  New = "new",
  Pending = "pending",
  Active = "active",
  Inactive = "inactive",
  Verified = "verified",
  Deleted = "deleted",
  Shipped = "shipped",
  Completed = "completed",
}

export const BaseSchema = z.object({
  key: z.string().length(12), // use createTxKey() to create a 12 char short key
  dateCreated: z.number(),   // Date.now()
  lastUpdated: z.number(),   // Date.now()
  version: z.number().gte(0),       // for optimistic locking
  status: z.nativeEnum(BaseStatus), // Corrected to z.nativeEnum
});

export const ContactSchema = BaseSchema.extend({
  first_name: z.string().optional(),              // optional
  last_name: z.string().optional(),               // optional
  email: z.string().email(),                    // required
  phone: z.string().optional(),                   // optional
  ip_address: z.string(),               // required
  details: z.map(z.string(), z.string()).optional(),    // optional
});

export const AddressSchema = z.object({
  addr1: z.string(),        // required
  addr2: z.string().optional(),       // optional
  addr3: z.string().optional(),       // optional
  city: z.string(),         // required
  state: z.string(),        // required
  zip: z.string(),          // required
  // latitude and longitude as a tuple, both optional
  latlng: z
    .tuple([z.number(), z.number()])
    .optional(), // [latitude, longitude]
});

export const UserSchema = ContactSchema.extend({
  roles: z.string(),                          // the roles that this user is authorized for
  preferences: z.map(z.string(), z.string()).optional(),      // specific preference settings
  company_name: z.string().optional(),                  // optional name of the company affiliation
  addresses: z.array(AddressSchema).optional(),             // array of addresses (home, work, billing, etc.)
});

// Zod map schemas for data storage
export const ContactMap = z.map(z.string(), ContactSchema);
export const UserMap = z.map(z.string(), UserSchema);

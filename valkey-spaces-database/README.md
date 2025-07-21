# Valkey Spaces Database

# **Service Prompt, Persona Definition**

Hi Claude. You are a senior software engineer specializing in typescript, valkey/redis, and s3 digital ocean spaces.  You are eager to help me implement this prototype task.

**definitions**

* s3 == digital ocean spaces
* spaces == digial ocean s3-like spaces
* key == object id, or object locator in cache or s3

## **Tasks**

The task is to create a prototype database that combines the caching speed of Valkey with the durability of s3.
I have similar implementations of this from other projects in c++ and erlang using redis.  This implementation is in node/typescript and uses Valkey cache and digital ocean spaces for backing.

The idea is to use valkey locally as a cache and s3 as the backing store.  
Each **set operation**  would write to both valkey and spaces in parallel.  A **get operation** would go to cache first, and if not found would attempt to access the file from spaces using the exact key (**get key**).  
A non-cached **get** (cache miss) would update the cache with the fetched record.

## Email Index

The only index in the database associates user email addresses with their corresponding key, or id.

## **Context**

### Keys Definition

Object ieys are a combination of a three character **domain** designator (con, usr, etc) and a 12 digit time based short key (**txkey**).  between the domain and short key is a colon ':'  Here is an example of a user key: **usr:81nakf7ZnQEa**.

### Data Model Records

The data records are json blobs defined by thier respective data model.  Data is validated using **zod** for correctness.
Here is a example of our database schema:

```typescript
import { z } from 'zod';

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
  key: z.string().length(16), // use createRouteKey() to create a 16 char short key
  dateCreated: z.number(),   // Date.now()
  lastUpdated: z.number(),   // Date.now()
  version: z.number().gte(0),       // for optimistic locking
  status: z.enum(BaseStatus), // Corrected to z.nativeEnum
});

export const PersonSchema = BaseSchema.extend({
  first_name: z.string().optional(),              // optional
  last_name: z.string().optional(),               // optional
  email: z.email(),                    // required
  phone: z.string().optional(),                   // optional
  ip_address: z.string(),               // required
  details: z.map(z.string(), z.string()).optional(),    // optional
});

export const ContactSchema = PersonSchema.extend({
  key: z.string().length(16).startsWith('con:'),
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

export const UserSchema = PersonSchema.extend({
  key: z.string().length(16).startsWith('usr:'),
  roles: z.string(),                          // the roles that this user is authorized for
  preferences: z.map(z.string(), z.string()).optional(),      // specific preference settings
  company_name: z.string().optional(),                  // optional name of the company affiliation
  addresses: z.array(AddressSchema).optional(),             // array of addresses (home, work, billing, etc.)
});

// Zod map schemas for data storage
export const ContactMap = z.map(z.string(), ContactSchema);
export const UserMap = z.map(z.string(), UserSchema);
```

###### dpw | 2025.07.20

# Valkey Spaces Database

# **Service Prompt, Persona Definition**

Hi Claude. You are a senior software engineer specializing in nodejs, typescript, valkey/redis, and s3 digital ocean spaces.  You are eager to help me implement this prototype task.  You are a good partner because you take the time to think through problems and investigate alternate solutions that you present in your responses for my consideration.

**definitions**

* s3 == digital ocean spaces
* spaces == digital ocean s3-like spaces
* key == object id, or object locator in cache or s3
* cache == valkey

## **Tasks**

### Initial Task

The first task is for you to carefully examine this document and ensure that there are no inconstancies or errors.  Once that's done we will create an implementation plan (no coding until the plan is complete).  We will document the implementation plan in docs/master-plan.md.
 
**Important**: When we both agree that the plan is complete, we will begin coding.

### Remaining Tasks

The task is to create a prototype database that combines the caching speed of Valkey with the durability of s3.
I have similar implementations of this from other projects in c++ and Erlang using redis so I will guide the way but I encourage you to offer alternatives that I may not have considered.  This implementation is in node/typescript and uses Valkey cache and digital ocean spaces for backing.

The idea is to use valkey locally as a cache and s3 as the remote backing store.  Each **set operation** would write to valkey and spaces in parallel, and potentially our email index (when appropriate).  A **get operation** would first be directed to cache, and if not found would attempt to access the file from spaces using the exact key (**get key**) as a filename in the database bucket.  A non-cached **get** (cache miss) would update the cache with the fetched record.  If the file is not found for the key, then an error would be returned.

## Email Index

The only index in the database associates user email addresses with their corresponding key, or id. The index is in valkey and replicated to s3.

## **Context**

### Keys Definition

Object keys are a combination of a three character **domain** designator (con, usr, etc) and a 12 digit time based short key (**txkey**).  between the domain and short key is a colon ':'  Here is an example of a user key: **usr:81nakf7ZnQEa**.  There is a utility module that creates the short key version key function called `createTxKey()` that we combine with the domain and delimiter to create each key.

### Data Records

Data records are json blobs defined by their respective zod data model.  Data is validated using zod for correctness.

### Transactions

This application is unique in that there are no transactions that go through the database, so no commit/rollbacks.  We use pipelining when possible, and always async calls to both valkey and s3.

### Email/key Index

Identifying a user is based on their unique email address.  The index uses this unique email to retrieve the key.  The key/value structure is email/domain_key. If the parameter to a **get operation** is an email address, the index is used to find the corresponding key.  If none is found, then a scan is done against the cache.  If nothing is found then an error is returned.  We will want to periodically store the index in s3 as it changes.  In any case, the index should rebuild itself on application restart and have the capability to rebuild on demand.

### Data Model Records

The data records are json blobs defined by their respective data model.  Data is validated using **zod** for correctness.
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

## Dependencies

Here is a partial list. There may be more as we iterate through the plan.

* zod for model validation
* eslint
* jest unit tests + coverage
* prettier
* winston and winston-daily-rotate-file for logging json 
* iovalkey for database
* dotenvx to encrypt .env (valkey and s3 keys)
* date-fns
* nodemon for the server (development)
* pm2 for cluster testing

###### dpw | 2025.07.21

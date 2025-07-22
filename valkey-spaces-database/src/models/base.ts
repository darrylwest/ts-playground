import { z } from 'zod';

export enum BaseStatus {
  New = 'new',
  Pending = 'pending',
  Active = 'active',
  Inactive = 'inactive',
  Verified = 'verified',
  Deleted = 'deleted',
  Shipped = 'shipped',
  Completed = 'completed',
}

export const BaseSchema = z.object({
  key: z.string().length(16), // use createRouteKey() to create a 16 char key (domain:txkey format)
  dateCreated: z.number(), // Date.now()
  lastUpdated: z.number(), // Date.now()
  version: z.number().gte(0), // for optimistic locking
  status: z.nativeEnum(BaseStatus),
});

export type Base = z.infer<typeof BaseSchema>;

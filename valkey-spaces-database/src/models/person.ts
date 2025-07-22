import { z } from 'zod';
import { BaseSchema } from './base.js';

export const PersonSchema = BaseSchema.extend({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  ip_address: z.string(),
  details: z.map(z.string(), z.string()).optional(),
});

export type Person = z.infer<typeof PersonSchema>;
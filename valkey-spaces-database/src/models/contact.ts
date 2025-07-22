import { z } from 'zod';
import { PersonSchema } from './person.js';

export const ContactSchema = PersonSchema.extend({
  key: z.string().length(16).startsWith('con:'),
});

export type Contact = z.infer<typeof ContactSchema>;

// Zod map schema for data storage
export const ContactMap = z.map(z.string(), ContactSchema);

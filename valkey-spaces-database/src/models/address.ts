import { z } from 'zod';

export const AddressSchema = z.object({
  addr1: z.string(),
  addr2: z.string().optional(),
  addr3: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  // latitude and longitude as a tuple, both optional
  latlng: z.tuple([z.number(), z.number()]).optional(), // [latitude, longitude]
});

export type Address = z.infer<typeof AddressSchema>;

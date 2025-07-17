import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  greeting: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return `Hello, ${input.name}!`;
    }),
  addContact: t.procedure
    .input(z.object({ name: z.string(), email: z.string() }))
    .mutation(({ input }) => {
      console.log(`New contact: Name - ${input.name}, Email - ${input.email}`);
      return `Contact ${input.name} added successfully!`;
    }),
});

export type AppRouter = typeof appRouter;

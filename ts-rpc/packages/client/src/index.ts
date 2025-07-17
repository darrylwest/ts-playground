import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/src/router';
import { z, ZodError, ZodIssue } from 'zod';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
    }),
  ],
});

const contactSchema = z.object({
  name: z.string().min(3).max(25),
  email: z.string().email(),
});

async function main() {
  const result = await trpc.greeting.query({ name: 'from tRPC project' });
  console.log(result);

  const form = document.getElementById('contactForm') as HTMLFormElement;
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const emailInput = document.getElementById('email') as HTMLInputElement;
  const outputDiv = document.getElementById('output') as HTMLDivElement;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = nameInput.value;
    const email = emailInput.value;

    try {
      const validatedData = contactSchema.parse({ name, email });
      const rpcResult = await trpc.addContact.mutate(validatedData);
      outputDiv.textContent = `Server response: ${rpcResult}`;
      console.log('RPC Result:', rpcResult);
    } catch (error) {
      if (error instanceof ZodError) {
        outputDiv.textContent = `Validation errors: ${error.message}`;
        console.error('Validation errors:', error);
      } else {
        outputDiv.textContent = `An error occurred: ${error}`;
        console.error('An error occurred:', error);
      }
    }
  });
}

main();

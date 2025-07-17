import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router';

const app = express();
app.use(cors());

app.use('/favicon.ico', (req, res) => {
  res.status(204).send();
});

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
  })
);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

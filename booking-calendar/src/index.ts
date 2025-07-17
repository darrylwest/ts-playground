import express from 'express';
import dotenv from '@dotenvx/dotenvx';
import calendarRouter from './routes/calendar';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

app.use('/api', calendarRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

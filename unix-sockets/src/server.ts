// server.ts

import express, { Request, Response, Application } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Server } from 'http'; // Import the Server type from Node's http module

import { format, formatISO, parse, parseISO, isValid } from "date-fns";
import { z } from 'zod';

const app: Application = express();
const socketPath: string = path.join(__dirname, 'app.sock');

// date parse validation 
const ISODateString = z.string().refine((val) => {
  try {
    const parsedDate = parseISO(val);
    return isValid(parsedDate);
  } catch (e) {
    return false;
  }
});

function parseISODate(isoString: string): Date | null {
  const result = ISODateString.safeParse(isoString);

  if (result.success) {
    return parseISO(isoString);
  } 

  console.warn(`invalid date string: ${isoString}`, result.error);
  return null;
}

// --- Crucial: Clean up the socket file before starting ---
// If the server crashes, the socket file may not be removed,
// preventing the server from starting again.
try {
    if (fs.existsSync(socketPath)) {
        console.log('Removing old socket file...');
        fs.unlinkSync(socketPath);
    }
} catch (err: unknown) { // Type the error as 'unknown' for safety
    if (err instanceof Error) {
        console.error(`Error removing socket file: ${err.message}`);
    } else {
        console.error('An unknown error occurred while removing the socket file.', err);
    }
    process.exit(1);
}

app.get('/', (req: Request, res: Response) => {
    const body = {"message": 'Hello from your Express app via a Unix socket!'};
    res.send(JSON.stringify(body));
});

app.get('/ping', (req: Request, res: Response) => {
    res.send(JSON.stringify({"ping": "pong"}));
});

// format tokens: https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
app.get('/date', (req: Request, res: Response) => {
    const dt: string = format(new Date(), "yyyy-MM-dd");
    res.send(JSON.stringify({ date: dt }));
});

app.get('/time', (req: Request, res: Response) => {
    const tm: string = format(new Date(), "HH:mm");
    res.send(JSON.stringify({ time: tm }));
});

app.get('/iso', (req: Request, res: Response) => {
    const now: string = formatISO(new Date());
    res.send(JSON.stringify({ iso_now: now }));
});

app.get('/parse/:iso', (req: Request, res: Response) => {
    const iso: string = req.params.iso;
    const tm = parseISODate(iso);
    if (tm) {
      console.log('ok: ', tm.getTime());
      res.send(JSON.stringify({ parsed: iso, value: formatISO(tm), time: tm.getTime() }));
    } else {
      res.send(JSON.stringify({ error: iso  }));
    }
});

app.get('/api/get/:key', (req: Request, res: Response) => {
    const key: string = req.params.key;
    console.log(key);
    res.send(JSON.stringify({"key": key}));
});

// Instead of app.listen(3000), we listen on the file path.
// The 'server' constant is typed as http.Server for better type-checking.
const server: Server = app.listen(socketPath, () => {
    // Set permissions on the socket file.
    // This allows the web server (e.g., Nginx) to access it.
    // 777 is permissive for demonstration; in production, you might use 660
    // and ensure your web server user is in the correct group.
    fs.chmodSync(socketPath, '660'); 
    console.log(`Server is running on socket: ${socketPath}`);
    console.log(`Server PID: ${process.pid}`);
});

// listen for these signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);

function shutdown(signal: string) {
    console.log(`Received signal: ${signal}. Shutting down server...`);
    server.close((err?: Error) => {
        if (err) {
            console.error('Error during server shutdown:', err);
            process.exit(1);
        }
        console.log('Server shut down.');
        process.exit(0);
    });
}

import { google } from 'googleapis';
import dotenv from '@dotenvx/dotenvx';

dotenv.config();

const calendarId = '1426charlie@gmail.com'; // TODO: Replace with your calendar ID
const webhookUrl = 'https://e91818a31572.ngrok-free.app/api/calendar-webhook'; // TODO: Replace with your public webhook URL

async function registerWebhook() {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/calendar.events.readonly'],
    });

    const authClient = await auth.getClient();
    google.options({ auth: authClient as any });

    const calendar = google.calendar('v3');

    const res = await calendar.events.watch({
      calendarId: calendarId,
      requestBody: {
        id: `wh-${new Date().getTime()}`,
        type: 'web_hook',
        address: webhookUrl,
      },
    });

    console.log('Webhook registered successfully:', res.data);
  } catch (error) {
    console.error('Error registering webhook:', error);
  }
}

registerWebhook();

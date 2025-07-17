import express, { Request, Response } from 'express';

const router = express.Router();

router.post('/calendar-webhook', (req: Request, res: Response) => {
  const resourceState = req.headers['x-goog-resource-state'];
  const resourceId = req.headers['x-goog-resource-id'];
  const channelId = req.headers['x-goog-channel-id'];

  const webhookMessage = {
    eventType: 'calendarChange',
    resourceState: resourceState,
    resourceId: resourceId,
    channelId: channelId,
    timestamp: new Date().toISOString(),
    // In a real scenario, you might also include relevant data from req.body
    // For Google Calendar push notifications, the body is often empty for sync events,
    // and you'd fetch the actual event data using the Google Calendar API.
  };

  console.log('Simulating push to work queue:', JSON.stringify(webhookMessage, null, 2));

  res.status(200).send('OK');
});

export default router;

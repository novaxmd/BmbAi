// Vercel Serverless Function: /api/push/send
// Sends a Web Push notification to every subscribed browser/device.
// Uses the Node.js runtime (not edge) because the `web-push` library needs
// Node's crypto module for VAPID signing and payload encryption.
//
// Required Vercel env vars:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. "mailto:you@example.com")
//   DATABASE_URL
//   PUSH_SEND_SECRET (a secret you choose — required in the request to prevent random people
//                      from triggering mass notifications to all your users)

import webpush from 'web-push';
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const secret = req.headers['x-push-secret'];
    if (!secret || secret !== process.env.PUSH_SEND_SECRET) {
      res.status(401).json({ error: 'Invalid or missing push secret' });
      return;
    }

    const { title, body, url } = req.body || {};
    if (!title || !body) {
      res.status(400).json({ error: 'title and body are required' });
      return;
    }

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@bmbai.zone.id';

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not configured on the server.');
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not configured on the server.');
    const sql = neon(databaseUrl);

    const subscriptions = await sql`SELECT id, endpoint, p256dh, auth FROM push_subscriptions`;

    const payload = JSON.stringify({ title, body, url: url || '/' });

    let sent = 0;
    let removed = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sent++;
        } catch (err: any) {
          // 404/410 means the subscription is no longer valid — clean it up
          if (err.statusCode === 404 || err.statusCode === 410) {
            await sql`DELETE FROM push_subscriptions WHERE id = ${sub.id}`;
            removed++;
          } else {
            failed++;
            console.error(`Push failed for subscription ${sub.id}:`, err.message);
          }
        }
      })
    );

    res.status(200).json({ success: true, sent, removed, failed, total: subscriptions.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const webpush = require('web-push') as typeof import('web-push');

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
  configured: boolean;
}

export function getVapidConfig(): VapidConfig {
  const publicKey = (
    process.env.VAPID_PUBLIC_KEY ||
    process.env.VITE_VAPID_PUBLIC_KEY ||
    ''
  ).trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  const rawSubject = (process.env.VAPID_SUBJECT || 'mailto:soporte@hoy.app').trim();
  const subject =
    rawSubject.startsWith('mailto:') || rawSubject.startsWith('https://')
      ? rawSubject
      : `mailto:${rawSubject}`;

  return {
    publicKey,
    privateKey,
    subject,
    configured: Boolean(publicKey && privateKey),
  };
}

export async function sendWebPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: {
    title: string;
    body: string;
    tag?: string;
    url?: string;
  }
): Promise<{
  ok: boolean;
  gone?: boolean;
  statusCode?: number;
  error?: string;
}> {
  const cfg = getVapidConfig();
  if (!cfg.configured) {
    return {
      ok: false,
      error: 'Claves VAPID no configuradas en variables de entorno.',
    };
  }

  try {
    webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
    const result = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        tag: payload.tag || 'hoy-alert',
        url: payload.url || '/',
      }),
      {
        TTL: 60 * 30,
      }
    );

    return {
      ok: result.statusCode >= 200 && result.statusCode < 300,
      statusCode: result.statusCode,
    };
  } catch (err: any) {
    const statusCode = Number(err?.statusCode || 0);
    const gone = statusCode === 404 || statusCode === 410;
    return {
      ok: false,
      gone,
      statusCode,
      error: err?.message || 'Error enviando notificación Web Push.',
    };
  }
}

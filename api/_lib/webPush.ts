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

let cachedWebPush: any = null;

async function resolveWebPush(): Promise<any> {
  if (cachedWebPush) return cachedWebPush;
  try {
    const mod = await import('web-push');
    cachedWebPush = (mod as any).default || mod;
    return cachedWebPush;
  } catch (err) {
    throw new Error(`No se pudo cargar el modulo web-push: ${String(err)}`);
  }
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
    const wp = await resolveWebPush();
    if (typeof wp.setVapidDetails === 'function') {
      wp.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
    }
    const result = await wp.sendNotification(
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

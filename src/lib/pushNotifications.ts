export type WebPushStatus =
  | 'active'
  | 'unconfigured'
  | 'no-session'
  | 'unsupported'
  | 'denied'
  | 'error';

export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerWebPushSubscription(
  sessionToken: string
): Promise<{ ok: boolean; status: WebPushStatus; endpoint?: string; error?: string }> {
  if (!isWebPushSupported()) {
    return { ok: false, status: 'unsupported' };
  }
  if (!sessionToken) {
    return { ok: false, status: 'no-session' };
  }
  if (Notification.permission === 'denied') {
    return { ok: false, status: 'denied' };
  }

  try {
    const keyRes = await fetch('/api/push/subscribe');
    const keyData = await keyRes.json().catch(() => ({}));
    if (!keyData?.configured || !keyData?.publicKey) {
      return { ok: false, status: 'unconfigured' };
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration?.pushManager) {
      return { ok: false, status: 'unsupported' };
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const appServerKey = urlBase64ToUint8Array(keyData.publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });
    }

    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Lima';

    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        timezone,
        userAgent: navigator.userAgent,
      }),
    });

    const saveData = await saveRes.json().catch(() => ({}));
    if (!saveRes.ok || !saveData?.ok) {
      return {
        ok: false,
        status: 'error',
        error: saveData?.error || 'No se pudo guardar la suscripción push.',
      };
    }

    return {
      ok: true,
      status: 'active',
      endpoint: subscription.endpoint,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 'error',
      error: err?.message || 'Error activando Web Push.',
    };
  }
}

export async function unregisterWebPushSubscription(
  sessionToken: string
): Promise<void> {
  if (!isWebPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager?.getSubscription();
    const endpoint = subscription?.endpoint || '';
    if (subscription) {
      await subscription.unsubscribe().catch(() => undefined);
    }
    if (sessionToken) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ endpoint }),
      }).catch(() => undefined);
    }
  } catch {
    // Ignore cleanup errors
  }
}

export async function sendTestWebPush(
  sessionToken: string
): Promise<{ ok: boolean; error?: string }> {
  if (!sessionToken) {
    return { ok: false, error: 'Inicia sesión para probar Web Push.' };
  }
  try {
    let endpoint = '';
    if (isWebPushSupported()) {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager?.getSubscription();
      endpoint = sub?.endpoint || '';
    }
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        action: 'test',
        endpoint,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || 'No se pudo enviar la prueba push.' };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de red enviando prueba push.' };
  }
}

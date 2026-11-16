import { getSupabaseAdmin, parseJsonBody, sha256 } from '../_lib/supabaseAdmin.js';
import { getVapidConfig, sendWebPushNotification } from '../_lib/webPush.js';

function extractBearerToken(req: any): string {
  const auth = String(req.headers?.authorization || '');
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return '';
}

function sanitizeTimezone(rawTz?: string): string {
  const candidate = String(rawTz || '').trim();
  if (!candidate) return 'America/Lima';
  try {
    new Intl.DateTimeFormat('es-ES', { timeZone: candidate });
    return candidate;
  } catch {
    return 'America/Lima';
  }
}

async function resolveSessionProfileId(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  req: any
): Promise<string | null> {
  const token = extractBearerToken(req);
  if (!token) return null;

  const { data: sessionRow } = await supabase
    .from('user_sessions')
    .select('profile_id')
    .eq('session_token_hash', sha256(token))
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  return sessionRow?.profile_id || null;
}

export default async function handler(req: any, res: any) {
  const vapid = getVapidConfig();

  // 1. GET: entrega clave pública VAPID para suscribir el navegador
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      configured: vapid.configured,
      publicKey: vapid.configured ? vapid.publicKey : '',
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(503).json({
      ok: false,
      error: 'Base de datos Supabase no configurada en el servidor.',
    });
  }

  const profileId = await resolveSessionProfileId(supabase, req);
  if (!profileId) {
    return res.status(401).json({
      ok: false,
      error: 'Inicia sesión con tu cuenta para sincronizar notificaciones push.',
    });
  }

  try {
    // 2. POST: guardar suscripción O enviar push de prueba inmediata
    if (req.method === 'POST') {
      const body = parseJsonBody(req);

      if (body.action === 'test') {
        if (!vapid.configured) {
          return res.status(400).json({
            ok: false,
            error: 'Faltan VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en Vercel.',
          });
        }

        const { data: subs, error: fetchErr } = await supabase
          .from('push_subscriptions')
          .select('id, endpoint, p256dh, auth')
          .eq('user_id', profileId)
          .eq('enabled', true);

        if (fetchErr) {
          return res.status(500).json({ ok: false, error: fetchErr.message });
        }

        if (!subs || subs.length === 0) {
          return res.status(404).json({
            ok: false,
            error: 'No hay dispositivos suscritos todavía. Activa las alertas primero.',
          });
        }

        const targetEndpoint = String(body.endpoint || '').trim();
        const targets = targetEndpoint
          ? subs.filter((s: any) => s.endpoint === targetEndpoint)
          : subs;

        let sent = 0;
        let failed = 0;
        for (const sub of targets.length > 0 ? targets : subs) {
          const pushRes = await sendWebPushNotification(sub, {
            title: 'HOY · Push activo',
            body: 'Perfecto. Tus recordatorios llegarán incluso en segundo plano.',
            tag: 'hoy-push-test',
            url: '/',
          });
          if (pushRes.ok) {
            sent++;
          } else {
            failed++;
            if (pushRes.gone) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            }
          }
        }

        return res.status(200).json({
          ok: sent > 0,
          sent,
          failed,
        });
      }

      const subObj = body.subscription || body;
      const endpoint = String(subObj?.endpoint || '').trim();
      const p256dh = String(subObj?.keys?.p256dh || '').trim();
      const auth = String(subObj?.keys?.auth || '').trim();

      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({
          ok: false,
          error: 'Suscripción Web Push incompleta.',
        });
      }

      const timezone = sanitizeTimezone(body.timezone);
      const userAgent = String(body.userAgent || '').slice(0, 240);
      const nowIso = new Date().toISOString();

      const { error: upsertErr } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: profileId,
          endpoint,
          p256dh,
          auth,
          timezone,
          user_agent: userAgent,
          enabled: true,
          updated_at: nowIso,
        },
        { onConflict: 'endpoint' }
      );

      if (upsertErr) {
        return res.status(500).json({ ok: false, error: upsertErr.message });
      }

      return res.status(200).json({
        ok: true,
        mode: 'supabase',
        timezone,
      });
    }

    // 3. DELETE: desactivar suscripción de este dispositivo
    if (req.method === 'DELETE') {
      const body = parseJsonBody(req);
      const endpoint = String(body.endpoint || req.query?.endpoint || '').trim();

      if (endpoint) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', profileId)
          .eq('endpoint', endpoint);
      } else {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', profileId);
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Error gestionando suscripción Web Push.',
    });
  }
}

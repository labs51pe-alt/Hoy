import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { getVapidConfig, sendWebPushNotification } from '../_lib/webPush.js';

function getLocalClock(timezone: string): {
  ymd: string;
  dayOfWeek: number;
  nowMinutes: number;
} {
  const safeTz = (() => {
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: timezone });
      return timezone;
    } catch {
      return 'America/Lima';
    }
  })();

  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now);

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  const hh = Number(map.hour === '24' ? '0' : map.hour || '0');
  const mm = Number(map.minute || '0');
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    ymd: `${map.year}-${map.month}-${map.day}`,
    dayOfWeek: weekdayMap[map.weekday] ?? now.getDay(),
    nowMinutes: hh * 60 + mm,
  };
}

function addDaysYmd(ymdStr: string, offsetDays: number): string {
  const [y, m, d] = ymdStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + offsetDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function parseTimeToMins(raw?: string): number | null {
  if (!raw || typeof raw !== 'string') return null;
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const cronSecret = (process.env.CRON_SECRET || '').trim();
  if (cronSecret) {
    const authHeader = String(req.headers?.authorization || '');
    const bearer = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : '';
    const headerSecret = String(req.headers?.['x-cron-secret'] || '').trim();
    const querySecret = String(req.query?.secret || '').trim();
    if (
      bearer !== cronSecret &&
      headerSecret !== cronSecret &&
      querySecret !== cronSecret
    ) {
      return res.status(401).json({ ok: false, error: 'Cron no autorizado.' });
    }
  }

  const vapid = getVapidConfig();
  if (!vapid.configured) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'Claves VAPID aún no configuradas.',
      sent: 0,
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'Supabase no configurado.',
      sent: 0,
    });
  }

  try {
    const { data: subs, error: subsErr } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth, timezone, last_sent_keys')
      .eq('enabled', true);

    if (subsErr) {
      return res.status(500).json({ ok: false, error: subsErr.message });
    }

    if (!subs || subs.length === 0) {
      return res.status(200).json({ ok: true, checked: 0, sent: 0 });
    }

    const userIds = Array.from(new Set(subs.map((s: any) => s.user_id)));
    const [{ data: progressRows }, { data: profileRows }] = await Promise.all([
      supabase.from('progreso').select('user_id, data').in('user_id', userIds),
      supabase.from('profiles').select('id, name').in('id', userIds),
    ]);

    const progressByUser = new Map<string, any>();
    for (const row of progressRows || []) {
      progressByUser.set(row.user_id, row.data || {});
    }
    const nameByUser = new Map<string, string>();
    for (const row of profileRows || []) {
      nameByUser.set(row.id, String(row.name || '').split(' ')[0] || '');
    }

    let sent = 0;
    let cleaned = 0;
    let checked = 0;

    // Ventana de 6 minutos para soportar cron cada 1-5 min sin perder avisos
    const WINDOW_MINS = 6;

    for (const sub of subs) {
      checked++;
      const data = progressByUser.get(sub.user_id);
      if (!data || !data.alertsEnabled) continue;

      const clock = getLocalClock(sub.timezone || 'America/Lima');
      const sentState =
        sub.last_sent_keys && sub.last_sent_keys.d === clock.ymd
          ? {
              d: clock.ymd,
              keys: Array.isArray(sub.last_sent_keys.keys)
                ? [...sub.last_sent_keys.keys]
                : [],
            }
          : { d: clock.ymd, keys: [] as string[] };

      const dueAlerts: Array<{
        key: string;
        title: string;
        body: string;
        url: string;
      }> = [];

      // 1. Rutina activa del dia
      const routineKey =
        data.same === false
          ? data.re || 'semana'
          : clock.dayOfWeek === 0
          ? 'domingo'
          : 'semana';
      const routineList: [string, string][] = Array.isArray(
        data.routines?.[routineKey]
      )
        ? data.routines[routineKey]
        : [];
      const doneRut: number[] =
        data.rut?.d === clock.ymd && Array.isArray(data.rut?.x)
          ? data.rut.x
          : [];

      routineList.forEach(([title, time], idx) => {
        if (doneRut.includes(idx)) return;
        const mins = parseTimeToMins(time);
        if (mins === null) return;
        if (clock.nowMinutes >= mins && clock.nowMinutes <= mins + WINDOW_MINS) {
          const key = `rut-${idx}-${time}`;
          if (!sentState.keys.includes(key)) {
            dueAlerts.push({
              key,
              title: `HOY · ${time}`,
              body: title,
              url: '/',
            });
          }
        }
      });

      // 2. Tareas de proyectos con horario
      const projects = Array.isArray(data.projects) ? data.projects : [];
      projects.forEach((proj: any) => {
        if (proj?.st === 'terminado') return;
        const tasks = Array.isArray(proj?.tasks) ? proj.tasks : [];
        tasks.forEach((task: any, tIdx: number) => {
          if (task?.d) return;
          const mins = parseTimeToMins(task?.time);
          if (mins === null) return;
          if (clock.nowMinutes >= mins && clock.nowMinutes <= mins + WINDOW_MINS) {
            const key = `proj-${proj.id}-${tIdx}-${task.time}`;
            if (!sentState.keys.includes(key)) {
              dueAlerts.push({
                key,
                title: `HOY · ${task.time} (${proj.name || 'Proyecto'})`,
                body: task.t,
                url: '/',
              });
            }
          }
        });
      });

      // 3. Cierre nocturno (si no ha planificado manana)
      if (data.eveningReviewEnabled !== false) {
        const tomorrowStr = addDaysYmd(clock.ymd, 1);
        const alreadyPlannedTomorrow = Boolean(data.plannedDays?.[tomorrowStr]);
        const eveningMins =
          parseTimeToMins(data.eveningReviewTime || '21:00') ?? 21 * 60;
        if (
          !alreadyPlannedTomorrow &&
          clock.nowMinutes >= eveningMins &&
          clock.nowMinutes <= eveningMins + WINDOW_MINS
        ) {
          const key = `evening-${data.eveningReviewTime || '21:00'}`;
          if (!sentState.keys.includes(key)) {
            const firstName = nameByUser.get(sub.user_id);
            dueAlerts.push({
              key,
              title: firstName ? `HOY · Buenas noches, ${firstName}` : 'HOY · Cierre del día',
              body: '¿Dejamos todo igual para mañana o quieres organizarlo en 10 segundos?',
              url: '/',
            });
          }
        }
      }

      if (dueAlerts.length === 0) continue;

      let subGone = false;
      let sentAnyForSub = false;

      for (const alert of dueAlerts) {
        const pushRes = await sendWebPushNotification(sub, {
          title: alert.title,
          body: alert.body,
          tag: `hoy-${alert.key}`,
          url: alert.url,
        });

        if (pushRes.ok) {
          sent++;
          sentAnyForSub = true;
          sentState.keys.push(alert.key);
        } else if (pushRes.gone) {
          subGone = true;
          break;
        }
      }

      if (subGone) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        cleaned++;
      } else if (sentAnyForSub) {
        await supabase
          .from('push_subscriptions')
          .update({
            last_sent_at: new Date().toISOString(),
            last_sent_keys: sentState,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);
      }
    }

    return res.status(200).json({
      ok: true,
      checked,
      sent,
      cleaned,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Error ejecutando cron de notificaciones push.',
      stack: err?.stack || String(err),
    });
  }
}

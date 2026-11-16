import { getSupabaseAdmin, parseJsonBody, sha256 } from '../lib/supabaseAdmin';

function extractBearerToken(req: any): string {
  const auth = String(req.headers?.authorization || '');
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return '';
}

export default async function handler(req: any, res: any) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(200).json({ ok: true, mode: 'local', data: null });
  }

  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Sesión no autorizada.' });
  }

  try {
    const { data: sessionRow } = await supabase
      .from('user_sessions')
      .select('profile_id')
      .eq('session_token_hash', sha256(token))
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!sessionRow?.profile_id) {
      return res.status(401).json({ ok: false, error: 'Sesión expirada.' });
    }

    const profileId = sessionRow.profile_id;

    if (req.method === 'GET') {
      const { data: row, error } = await supabase
        .from('progreso')
        .select('data')
        .eq('user_id', profileId)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ ok: false, error: error.message });
      }
      return res.status(200).json({
        ok: true,
        mode: 'supabase',
        data: row?.data || null,
      });
    }

    if (req.method === 'POST') {
      const body = parseJsonBody(req);
      const rawData = body.data && typeof body.data === 'object' ? { ...body.data } : {};
      // No almacenar lista CRM global dentro del progreso individual del usuario
      delete rawData.subscribers;

      const { error } = await supabase.from('progreso').upsert({
        user_id: profileId,
        data: rawData,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        return res.status(500).json({ ok: false, error: error.message });
      }

      // Sincronizar preferencias clave (no bloqueante)
      try {
        await supabase.from('user_preferences').upsert({
          profile_id: profileId,
          theme: rawData.theme === 'dark' ? 'dark' : 'light',
          same_sunday_routine: rawData.same !== false,
          active_routine_mode: rawData.re === 'domingo' ? 'domingo' : 'semana',
          alerts_enabled: Boolean(rawData.alertsEnabled),
          alerts_sound: rawData.alertsSound !== false,
          evening_review_enabled: rawData.eveningReviewEnabled !== false,
          evening_review_time: String(rawData.eveningReviewTime || '21:00'),
        });
      } catch {
        // Non-blocking normalized mirror
      }

      return res.status(200).json({ ok: true, mode: 'supabase' });
    }

    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Error sincronizando progreso.',
    });
  }
}

import { getSupabaseAdmin, sha256 } from '../_lib/supabaseAdmin.js';

function extractBearerToken(req: any): string {
  const auth = String(req.headers?.authorization || '');
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return '';
}

export default async function handler(req: any, res: any) {
  const supabase = getSupabaseAdmin();
  const token = extractBearerToken(req);

  if (!supabase) {
    return res.status(200).json({
      ok: true,
      mode: 'local',
      authenticated: false,
    });
  }

  if (!token) {
    return res.status(200).json({
      ok: true,
      mode: 'supabase',
      authenticated: false,
    });
  }

  const tokenHash = sha256(token);

  if (req.method === 'DELETE') {
    await supabase
      .from('user_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('session_token_hash', tokenHash);

    return res.status(200).json({ ok: true, mode: 'supabase', authenticated: false });
  }

  try {
    const { data: sessionRow } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token_hash', tokenHash)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!sessionRow) {
      return res.status(200).json({
        ok: true,
        mode: 'supabase',
        authenticated: false,
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionRow.profile_id)
      .maybeSingle();

    if (!profile || profile.status !== 'activo') {
      return res.status(200).json({
        ok: true,
        mode: 'supabase',
        authenticated: false,
      });
    }

    await supabase
      .from('user_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', sessionRow.id);

    const { data: progresoRow } = await supabase
      .from('progreso')
      .select('data')
      .eq('user_id', profile.id)
      .maybeSingle();

    return res.status(200).json({
      ok: true,
      mode: 'supabase',
      authenticated: true,
      profile: {
        id: profile.id,
        name: profile.name,
        phone: `${profile.country_code || '+51'} ${profile.phone_local || ''}`.trim(),
        plan: profile.plan,
        status: profile.status,
      },
      progressData: progresoRow?.data || null,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Error validando sesión.',
    });
  }
}

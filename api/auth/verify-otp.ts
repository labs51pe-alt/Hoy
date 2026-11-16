import {
  generateSessionToken,
  getSupabaseAdmin,
  normalizePhoneE164,
  parseJsonBody,
  sha256,
} from '../../lib/supabaseAdmin';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const body = parseJsonBody(req);
  const countryCode = String(body.countryCode || '+51').trim();
  const phoneNum = String(body.phoneNum || '').trim();
  const code = String(body.code || '').trim();
  const deviceLabel = String(body.deviceLabel || 'Web PWA').slice(0, 80);

  if (!phoneNum || !code) {
    return res.status(400).json({
      ok: false,
      error: 'Ingresa tu teléfono y el código OTP de 6 dígitos.',
    });
  }

  const phone = normalizePhoneE164(phoneNum, countryCode);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return res.status(200).json({
      ok: true,
      mode: 'local',
    });
  }

  try {
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone_e164', phone.e164)
      .maybeSingle();

    if (profErr || !profile) {
      return res.status(404).json({
        ok: false,
        error: 'Perfil no encontrado.',
      });
    }

    if (profile.status !== 'activo') {
      return res.status(403).json({
        ok: false,
        error: 'Tu membresía aún no está activa.',
      });
    }

    const { data: otpRow, error: otpErr } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('profile_id', profile.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpErr || !otpRow) {
      return res.status(400).json({
        ok: false,
        error: 'El código expiró o no existe. Solicita uno nuevo.',
      });
    }

    if ((otpRow.attempts || 0) >= 5) {
      return res.status(429).json({
        ok: false,
        error: 'Demasiados intentos fallidos. Solicita un nuevo código.',
      });
    }

    if (sha256(code) !== otpRow.code_hash) {
      await supabase
        .from('otp_codes')
        .update({ attempts: (otpRow.attempts || 0) + 1 })
        .eq('id', otpRow.id);

      return res.status(400).json({
        ok: false,
        error: 'Código OTP incorrecto. Verifica tu WhatsApp.',
      });
    }

    const nowIso = new Date().toISOString();
    await supabase
      .from('otp_codes')
      .update({ used_at: nowIso })
      .eq('id', otpRow.id);

    await supabase
      .from('profiles')
      .update({
        last_otp_verified_at: nowIso,
        last_login_at: nowIso,
      })
      .eq('id', profile.id);

    // Crear sesión de 7 días
    const sessionToken = generateSessionToken();
    const sessionExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: sessErr } = await supabase.from('user_sessions').insert({
      profile_id: profile.id,
      session_token_hash: sha256(sessionToken),
      device_label: deviceLabel,
      expires_at: sessionExpiresAt,
    });

    if (sessErr) {
      return res.status(500).json({ ok: false, error: sessErr.message });
    }

    const { data: progresoRow } = await supabase
      .from('progreso')
      .select('data')
      .eq('user_id', profile.id)
      .maybeSingle();

    return res.status(200).json({
      ok: true,
      mode: 'supabase',
      sessionToken,
      profile: {
        id: profile.id,
        name: profile.name,
        phone: phone.formatted,
        plan: profile.plan,
        status: profile.status,
      },
      progressData: progresoRow?.data || null,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Error verificando código OTP.',
    });
  }
}

import crypto from 'node:crypto';
import {
  getSupabaseAdmin,
  normalizePhoneE164,
  parseJsonBody,
  sha256,
  triggerN8nWhatsApp,
} from '../_lib/supabaseAdmin';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const body = parseJsonBody(req);
  const countryCode = String(body.countryCode || '+51').trim();
  const phoneNum = String(body.phoneNum || '').trim();
  const sessionToken = String(body.sessionToken || '').trim();

  if (!phoneNum || phoneNum.replace(/\D/g, '').length < 6) {
    return res.status(400).json({
      ok: false,
      error: 'Ingresa un número de WhatsApp válido.',
    });
  }

  const phone = normalizePhoneE164(phoneNum, countryCode);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return res.status(200).json({
      ok: true,
      mode: 'local',
      skipOtp: false,
    });
  }

  try {
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone_e164', phone.e164)
      .maybeSingle();

    if (profErr) {
      return res.status(500).json({ ok: false, error: profErr.message });
    }

    if (!profile) {
      return res.status(404).json({
        ok: false,
        error: 'Número no registrado. Toca "Hazte socio" para solicitar tu acceso.',
      });
    }

    if (profile.status === 'pendiente') {
      return res.status(403).json({
        ok: false,
        status: 'pendiente',
        error: 'Tu pago está pendiente de aprobación por el administrador.',
      });
    }

    if (profile.status === 'pausado' || profile.status === 'vencido') {
      return res.status(403).json({
        ok: false,
        status: profile.status,
        error: `Tu membresía figura como "${profile.status}". Escribe al administrador para reactivarla.`,
      });
    }

    // Regla de 7 días: si este dispositivo ya tiene una sesión vigente (< 7 días) para este usuario, entra directo sin pedir OTP
    if (sessionToken) {
      const tokenHash = sha256(sessionToken);
      const { data: sessionRow } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('session_token_hash', tokenHash)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (sessionRow) {
        await supabase
          .from('user_sessions')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', sessionRow.id);

        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', profile.id);

        const { data: progresoRow } = await supabase
          .from('progreso')
          .select('data')
          .eq('user_id', profile.id)
          .maybeSingle();

        return res.status(200).json({
          ok: true,
          mode: 'supabase',
          skipOtp: true,
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
      }
    }

    // Generar OTP de 6 dígitos con validez de 10 minutos
    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: otpErr } = await supabase.from('otp_codes').insert({
      profile_id: profile.id,
      phone_e164: phone.e164,
      code_hash: sha256(code),
      expires_at: expiresAt,
    });

    if (otpErr) {
      return res.status(500).json({ ok: false, error: otpErr.message });
    }

    const messagePreview = `Tu código de acceso para HOY es: ${code}. Válido por 10 minutos.`;
    const waResult = await triggerN8nWhatsApp(supabase, {
      profileId: profile.id,
      phoneE164: phone.e164,
      eventType: 'otp_login',
      name: profile.name,
      plan: profile.plan,
      amountPen: Number(profile.amount_pen) || 75,
      otpCode: code,
      messagePreview,
    });

    const n8nActive = Boolean(
      process.env.N8N_WEBHOOK_URL && process.env.N8N_WEBHOOK_URL.startsWith('http')
    );

    return res.status(200).json({
      ok: true,
      mode: 'supabase',
      skipOtp: false,
      whatsappSent: waResult.sent,
      devOtp: !n8nActive || !waResult.sent ? code : undefined,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Error solicitando código OTP.',
    });
  }
}

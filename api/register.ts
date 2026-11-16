import {
  PLAN_PRICES_PEN,
  getSupabaseAdmin,
  mapDbProfileToSubscriber,
  normalizePhoneE164,
  parseJsonBody,
  triggerN8nWhatsApp,
} from './_lib/supabaseAdmin.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const body = parseJsonBody(req);
    const name = String(body.name || '').trim();
    const countryCode = String(body.countryCode || '+51').trim();
    const phoneNum = String(body.phoneNum || '').trim();
    const city = String(body.city || '').trim() || 'No especificada';
    const plan =
      body.plan === 'Mensual' || body.plan === 'Trimestral' || body.plan === 'Vitalicio'
        ? body.plan
        : 'Vitalicio';

    if (!name || !phoneNum || phoneNum.replace(/\D/g, '').length < 6) {
      return res.status(400).json({
        ok: false,
        error: 'Por favor ingresa tu nombre completo y un número de WhatsApp válido.',
      });
    }

    const phone = normalizePhoneE164(phoneNum, countryCode);
    const amountPen = PLAN_PRICES_PEN[plan] ?? 75;
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return res.status(200).json({
        ok: true,
        mode: 'local',
        whatsappSent: false,
        subscriber: {
          id: Date.now(),
          name,
          phone: phone.formatted,
          city,
          status: 'pendiente',
          plan,
          amount: amountPen,
          paymentMethod: 'Por definir',
          paymentStatus: 'pendiente',
          date: new Date().toISOString().slice(0, 10),
          payments: [],
        },
      });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone_e164', phone.e164)
      .maybeSingle();

    if (fetchErr) {
      return res.status(500).json({ ok: false, error: fetchErr.message });
    }

    if (existing && existing.status === 'activo') {
      return res.status(409).json({
        ok: false,
        error:
          'Este número ya cuenta con una membresía activa. Toca "Comenzar" para iniciar sesión.',
      });
    }

    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    let profile = existing;

    if (existing) {
      const { data: updated, error: updErr } = await supabase
        .from('profiles')
        .update({
          name,
          country_code: phone.countryCode,
          phone_local: phone.local,
          city,
          plan,
          amount_pen: amountPen,
          status: existing.status === 'activo' ? 'activo' : 'activo',
          payment_status: existing.payment_status === 'pagado' ? 'pagado' : 'trial',
          trial_ends_at: existing.trial_ends_at || trialEndsAt,
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (updErr) {
        return res.status(500).json({ ok: false, error: updErr.message });
      }
      profile = updated;
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('profiles')
        .insert({
          name,
          country_code: phone.countryCode,
          phone_local: phone.local,
          phone_e164: phone.e164,
          city,
          role: 'user',
          status: 'activo',
          plan,
          amount_pen: amountPen,
          payment_method: 'Prueba 7 días',
          payment_status: 'trial',
          trial_ends_at: trialEndsAt,
        })
        .select('*')
        .single();

      if (insErr) {
        return res.status(500).json({ ok: false, error: insErr.message });
      }
      profile = inserted;
    }

    const messagePreview = `¡Hola ${name}! Tu prueba gratuita de 7 días en HOY ya está activa. Disfruta de tu sistema de ejecución diaria (Plan ${plan}). ¡A por tu día!`;

    const waResult = await triggerN8nWhatsApp(supabase, {
      profileId: profile.id,
      phoneE164: phone.e164,
      eventType: 'inicio_prueba',
      name,
      plan,
      amountPen,
      messagePreview,
    });

    return res.status(200).json({
      ok: true,
      mode: 'supabase',
      whatsappSent: waResult.sent,
      subscriber: mapDbProfileToSubscriber(profile, []),
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Error registrando usuario en Supabase.',
    });
  }
}

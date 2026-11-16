import {
  PLAN_PRICES_PEN,
  calculateExpiresAt,
  getAdminPin,
  getSupabaseAdmin,
  mapDbProfileToSubscriber,
  normalizePhoneE164,
  parseJsonBody,
  triggerN8nWhatsApp,
} from '../../lib/supabaseAdmin';

function isAdminAuthorized(req: any): boolean {
  const pinHeader = String(req.headers?.['x-admin-pin'] || '').trim();
  return pinHeader !== '' && pinHeader === getAdminPin();
}

export default async function handler(req: any, res: any) {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'PIN de administrador inválido.' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(200).json({
      ok: true,
      mode: 'local',
      subscribers: [],
    });
  }

  try {
    if (req.method === 'GET') {
      const [{ data: profiles, error: pErr }, { data: payments, error: payErr }] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('payments')
            .select('*')
            .order('paid_at', { ascending: false })
            .order('created_at', { ascending: false }),
        ]);

      if (pErr) return res.status(500).json({ ok: false, error: pErr.message });
      if (payErr) return res.status(500).json({ ok: false, error: payErr.message });

      const paymentsByProfile: Record<string, any[]> = {};
      (payments || []).forEach((pay: any) => {
        if (!paymentsByProfile[pay.profile_id]) {
          paymentsByProfile[pay.profile_id] = [];
        }
        paymentsByProfile[pay.profile_id].push(pay);
      });

      const subscribers = (profiles || []).map((prof: any, idx: number) =>
        mapDbProfileToSubscriber(prof, paymentsByProfile[prof.id] || [], idx + 1)
      );

      return res.status(200).json({
        ok: true,
        mode: 'supabase',
        subscribers,
      });
    }

    if (req.method === 'POST') {
      const body = parseJsonBody(req);
      const name = String(body.name || '').trim();
      const rawPhone = String(body.phone || '').trim();
      const city = String(body.city || '').trim() || 'No especificada';
      const status =
        body.status === 'activo' ||
        body.status === 'pausado' ||
        body.status === 'vencido'
          ? body.status
          : 'pendiente';
      const plan =
        body.plan === 'Mensual' ||
        body.plan === 'Trimestral' ||
        body.plan === 'Vitalicio'
          ? body.plan
          : 'Vitalicio';
      const amountPen =
        typeof body.amount === 'number' && !Number.isNaN(body.amount)
          ? body.amount
          : PLAN_PRICES_PEN[plan] ?? 75;
      const paymentMethod = String(body.paymentMethod || 'Yape');
      const isPaid = status === 'activo' || body.paymentStatus === 'pagado';
      const paymentStatus =
        body.paymentStatus === 'reembolsado'
          ? 'reembolsado'
          : isPaid
          ? 'pagado'
          : 'pendiente';
      const paymentRef = String(body.paymentRef || '').trim();
      const notes = String(body.notes || '').trim();

      if (!name || !rawPhone) {
        return res.status(400).json({
          ok: false,
          error: 'Nombre y WhatsApp son obligatorios.',
        });
      }

      const phone = normalizePhoneE164(rawPhone);
      const nowIso = new Date().toISOString();

      const { data: insertedProfile, error: insErr } = await supabase
        .from('profiles')
        .insert({
          name,
          country_code: phone.countryCode,
          phone_local: phone.local,
          phone_e164: phone.e164,
          city,
          status,
          plan,
          amount_pen: amountPen,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          payment_ref: paymentRef,
          notes,
          approved_at: isPaid ? nowIso : null,
          expires_at: isPaid ? calculateExpiresAt(plan) : null,
        })
        .select('*')
        .single();

      if (insErr) {
        if (insErr.code === '23505') {
          return res.status(409).json({
            ok: false,
            error: 'Ya existe un cliente registrado con ese número de WhatsApp.',
          });
        }
        return res.status(500).json({ ok: false, error: insErr.message });
      }

      let createdPayments: any[] = [];
      if (isPaid && amountPen > 0) {
        const { data: payRow } = await supabase
          .from('payments')
          .insert({
            profile_id: insertedProfile.id,
            plan,
            amount_pen: amountPen,
            method: paymentMethod === 'Por definir' ? 'Yape' : paymentMethod,
            status: 'confirmado',
            reference_code: paymentRef,
            note: `Alta directa (${plan})`,
            paid_at: nowIso.slice(0, 10),
          })
          .select('*')
          .single();
        if (payRow) createdPayments = [payRow];
      }

      return res.status(200).json({
        ok: true,
        mode: 'supabase',
        subscriber: mapDbProfileToSubscriber(insertedProfile, createdPayments),
      });
    }

    if (req.method === 'PATCH') {
      const body = parseJsonBody(req);
      const dbId = String(body.dbId || '').trim();
      if (!dbId) {
        return res.status(400).json({ ok: false, error: 'Falta dbId del cliente.' });
      }

      const action = String(body.action || 'update');
      const nowIso = new Date().toISOString();

      if (action === 'approve') {
        const { data: current } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', dbId)
          .single();

        if (!current) {
          return res.status(404).json({ ok: false, error: 'Cliente no encontrado.' });
        }

        const amountPen =
          Number(body.amount ?? current.amount_pen) ||
          PLAN_PRICES_PEN[current.plan] ||
          75;
        const method =
          current.payment_method && current.payment_method !== 'Por definir'
            ? current.payment_method
            : 'Yape';

        const { data: updated, error: updErr } = await supabase
          .from('profiles')
          .update({
            status: 'activo',
            payment_status: 'pagado',
            payment_method: method,
            amount_pen: amountPen,
            approved_at: current.approved_at || nowIso,
            expires_at: calculateExpiresAt(current.plan),
          })
          .eq('id', dbId)
          .select('*')
          .single();

        if (updErr) return res.status(500).json({ ok: false, error: updErr.message });

        const { data: existingPays } = await supabase
          .from('payments')
          .select('*')
          .eq('profile_id', dbId)
          .order('paid_at', { ascending: false });

        let paymentsList = existingPays || [];
        if (paymentsList.length === 0) {
          const { data: newPay } = await supabase
            .from('payments')
            .insert({
              profile_id: dbId,
              plan: updated.plan,
              amount_pen: amountPen,
              method,
              status: 'confirmado',
              reference_code: updated.payment_ref || '',
              note: `Activación ${updated.plan}`,
              paid_at: nowIso.slice(0, 10),
            })
            .select('*')
            .single();
          if (newPay) paymentsList = [newPay];
        }

        await triggerN8nWhatsApp(supabase, {
          profileId: updated.id,
          phoneE164: updated.phone_e164,
          eventType: 'aprobacion_bienvenida',
          name: updated.name,
          plan: updated.plan,
          amountPen,
          messagePreview: `¡Hola ${updated.name}! Tu pago de S/ ${amountPen.toFixed(
            2
          )} fue confirmado. Tu acceso a HOY ya está ACTIVO. Entra y presiona "Comenzar" con tu WhatsApp.`,
        });

        return res.status(200).json({
          ok: true,
          mode: 'supabase',
          subscriber: mapDbProfileToSubscriber(updated, paymentsList),
        });
      }

      if (action === 'add_payment') {
        const pay = body.payment || {};
        const amountPen = Math.max(0, Number(pay.amount) || 0);
        const method = String(pay.method || 'Yape');
        const ref = String(pay.ref || '').trim();
        const note = String(pay.note || '').trim();
        const paidAt = String(pay.date || nowIso.slice(0, 10));

        const { data: current } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', dbId)
          .single();

        if (!current) {
          return res.status(404).json({ ok: false, error: 'Cliente no encontrado.' });
        }

        const { error: payErr } = await supabase.from('payments').insert({
          profile_id: dbId,
          plan: current.plan,
          amount_pen: amountPen,
          method,
          status: 'confirmado',
          reference_code: ref,
          note: note || `Cobro ${current.plan}`,
          paid_at: paidAt,
        });

        if (payErr) return res.status(500).json({ ok: false, error: payErr.message });

        const { data: updated, error: updErr } = await supabase
          .from('profiles')
          .update({
            status: 'activo',
            payment_status: 'pagado',
            payment_method: method,
            payment_ref: ref || current.payment_ref,
            approved_at: current.approved_at || nowIso,
            expires_at: calculateExpiresAt(current.plan),
          })
          .eq('id', dbId)
          .select('*')
          .single();

        if (updErr) return res.status(500).json({ ok: false, error: updErr.message });

        const { data: allPays } = await supabase
          .from('payments')
          .select('*')
          .eq('profile_id', dbId)
          .order('paid_at', { ascending: false })
          .order('created_at', { ascending: false });

        return res.status(200).json({
          ok: true,
          mode: 'supabase',
          subscriber: mapDbProfileToSubscriber(updated, allPays || []),
        });
      }

      // Actualización general de campos de cliente
      const patch = body.patch || {};
      const dbPatch: Record<string, any> = {};
      if (patch.name !== undefined) dbPatch.name = String(patch.name).trim();
      if (patch.city !== undefined) dbPatch.city = String(patch.city).trim();
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.plan !== undefined) dbPatch.plan = patch.plan;
      if (patch.amount !== undefined) dbPatch.amount_pen = Number(patch.amount) || 0;
      if (patch.paymentMethod !== undefined)
        dbPatch.payment_method = patch.paymentMethod;
      if (patch.paymentStatus !== undefined)
        dbPatch.payment_status = patch.paymentStatus;
      if (patch.paymentRef !== undefined) dbPatch.payment_ref = patch.paymentRef;
      if (patch.notes !== undefined) dbPatch.notes = patch.notes;
      if (patch.phone !== undefined) {
        const norm = normalizePhoneE164(patch.phone);
        dbPatch.country_code = norm.countryCode;
        dbPatch.phone_local = norm.local;
        dbPatch.phone_e164 = norm.e164;
      }

      const { data: updated, error: updErr } = await supabase
        .from('profiles')
        .update(dbPatch)
        .eq('id', dbId)
        .select('*')
        .single();

      if (updErr) return res.status(500).json({ ok: false, error: updErr.message });

      const { data: allPays } = await supabase
        .from('payments')
        .select('*')
        .eq('profile_id', dbId)
        .order('paid_at', { ascending: false })
        .order('created_at', { ascending: false });

      return res.status(200).json({
        ok: true,
        mode: 'supabase',
        subscriber: mapDbProfileToSubscriber(updated, allPays || []),
      });
    }

    if (req.method === 'DELETE') {
      const body = parseJsonBody(req);
      const dbId = String(req.query?.id || body.dbId || '').trim();
      if (!dbId) {
        return res.status(400).json({ ok: false, error: 'Falta dbId.' });
      }

      const { error: delErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', dbId);

      if (delErr) return res.status(500).json({ ok: false, error: delErr.message });

      return res.status(200).json({ ok: true, mode: 'supabase' });
    }

    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Error en operación administrativa CRM.',
    });
  }
}

import crypto from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const PLAN_PRICES_PEN: Record<string, number> = {
  Vitalicio: 75,
  Trimestral: 55,
  Mensual: 25,
};

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    '';

  if (!url.startsWith('http') || !serviceKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}

export function normalizePhoneE164(
  rawPhone: string,
  countryCode = '+51'
): { e164: string; countryCode: string; local: string; formatted: string } {
  const cleaned = String(rawPhone || '').trim();
  const digits = cleaned.replace(/[^\d+]/g, '');

  if (digits.startsWith('+')) {
    const knownCodes = ['+51', '+52', '+57', '+54', '+34', '+56', '+1'];
    const matchedCode =
      knownCodes.find((c) => digits.startsWith(c)) || countryCode;
    const localDigits = digits.slice(matchedCode.length).replace(/\D/g, '');
    return {
      e164: `${matchedCode}${localDigits}`,
      countryCode: matchedCode,
      local: localDigits,
      formatted: `${matchedCode} ${localDigits}`,
    };
  }

  const localDigits = digits.replace(/\D/g, '');
  const safeCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  return {
    e164: `${safeCode}${localDigits}`,
    countryCode: safeCode,
    local: localDigits,
    formatted: `${safeCode} ${localDigits}`,
  };
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getAdminPin(): string {
  return (process.env.ADMIN_CRM_PIN || '1982').trim();
}

export function parseJsonBody(req: any): any {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export async function triggerN8nWhatsApp(
  supabase: SupabaseClient | null,
  params: {
    profileId?: string | null;
    phoneE164: string;
    eventType:
      | 'instrucciones_pago'
      | 'aprobacion_bienvenida'
      | 'otp_login'
      | 'recordatorio_pago';
    name: string;
    plan?: string;
    amountPen?: number;
    otpCode?: string;
    messagePreview: string;
  }
): Promise<{ sent: boolean; error?: string }> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL || '';
  let deliveryStatus: 'pendiente' | 'enviado' | 'error' = 'pendiente';
  let errorDetail = '';

  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: params.eventType,
          phone: params.phoneE164,
          name: params.name,
          plan: params.plan || 'Vitalicio',
          amount_pen: params.amountPen ?? 75,
          otp_code: params.otpCode || null,
          message: params.messagePreview,
          app_url: process.env.APP_URL || '',
          timestamp: new Date().toISOString(),
        }),
      });
      deliveryStatus = response.ok ? 'enviado' : 'error';
      if (!response.ok) {
        errorDetail = `HTTP ${response.status}`;
      }
    } catch (err: any) {
      deliveryStatus = 'error';
      errorDetail = err?.message || 'Fetch error';
    }
  }

  if (supabase) {
    try {
      await supabase.from('whatsapp_logs').insert({
        profile_id: params.profileId || null,
        phone_e164: params.phoneE164,
        event_type: params.eventType,
        message_preview: params.messagePreview,
        delivery_status: deliveryStatus,
        error_detail: errorDetail,
      });
    } catch {
      // Non-blocking audit log
    }
  }

  return {
    sent: deliveryStatus === 'enviado',
    error: errorDetail || undefined,
  };
}

export function mapDbProfileToSubscriber(
  profile: any,
  payments: any[] = [],
  numericFallbackId = 1
) {
  const numericId =
    typeof profile.numeric_id === 'number'
      ? profile.numeric_id
      : Number(String(profile.id || '').replace(/\D/g, '').slice(0, 12)) ||
        numericFallbackId;

  return {
    id: numericId,
    dbId: profile.id,
    name: profile.name,
    phone: `${profile.country_code || '+51'} ${profile.phone_local || ''}`.trim(),
    city: profile.city || 'No especificada',
    status: profile.status || 'pendiente',
    plan: profile.plan || 'Vitalicio',
    amount: Number(profile.amount_pen) || 75,
    paymentMethod: profile.payment_method || 'Por definir',
    paymentStatus: profile.payment_status || 'pendiente',
    paymentRef: profile.payment_ref || '',
    notes: profile.notes || '',
    date: String(profile.created_at || new Date().toISOString()).slice(0, 10),
    approvedAt: profile.approved_at
      ? String(profile.approved_at).slice(0, 10)
      : undefined,
    payments: payments.map((p, idx) => ({
      id:
        Number(String(p.id || '').replace(/\D/g, '').slice(0, 10)) ||
        Date.now() + idx,
      date: String(p.paid_at || p.created_at || '').slice(0, 10),
      amount: Number(p.amount_pen) || 0,
      method: p.method || 'Yape',
      ref: p.reference_code || '',
      note: p.note || '',
    })),
  };
}

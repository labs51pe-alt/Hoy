import { getAdminPin, parseJsonBody } from '../../lib/supabaseAdmin';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const body = parseJsonBody(req);
  const pin = String(body.pin || '').trim();

  if (pin !== getAdminPin()) {
    return res.status(401).json({
      ok: false,
      error: 'Clave incorrecta. Intenta de nuevo.',
    });
  }

  return res.status(200).json({ ok: true });
}

import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';

export default async function handler(_req: any, res: any) {
  const supabaseConfigured = Boolean(getSupabaseAdmin());
  const n8nConfigured = Boolean(
    process.env.N8N_WEBHOOK_URL && process.env.N8N_WEBHOOK_URL.startsWith('http')
  );

  return res.status(200).json({
    ok: true,
    supabaseConfigured,
    n8nConfigured,
    mode: supabaseConfigured ? 'supabase' : 'local',
    timestamp: new Date().toISOString(),
  });
}

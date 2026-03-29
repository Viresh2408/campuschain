import { supabaseAdmin } from '../../../lib/supabase';

// GET /api/admin/check-tables — verifies all required tables exist in Supabase
export default async function handler(req, res) {
  const tables = ['users', 'blocks', 'ledger', 'events', 'tickets', 'fraud_alerts'];
  const missing = [];

  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select('id').limit(1);
    // error code 42P01 = table doesn't exist, PGRST116 = no rows (table exists!)
    if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache'))) {
      missing.push(table);
    }
  }

  if (missing.length === 0) {
    return res.json({ ok: true, message: `All ${tables.length} tables found ✅` });
  }

  return res.json({
    ok: false,
    message: `Missing tables: ${missing.join(', ')} — run the SQL first`,
    missing,
  });
}

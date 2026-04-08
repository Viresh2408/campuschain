import { supabaseAdmin } from '../../../../lib/supabase';
import { requireAuth } from '../../../../lib/auth';

export default requireAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    const { id } = req.query;

    const { data: items, error } = await supabaseAdmin
      .from('vendor_items')
      .select('id, name, price')
      .eq('vendor_id', id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(items);
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

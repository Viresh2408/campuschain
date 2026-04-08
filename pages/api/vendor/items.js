import { supabaseAdmin } from '../../../lib/supabase';
import { requireRole } from '../../../lib/auth';

export default requireRole('vendor', async function handler(req, res) {
  if (req.method === 'GET') {
    const { data: items, error } = await supabaseAdmin
      .from('vendor_items')
      .select('*')
      .eq('vendor_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch items error:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.json(items);
  }

  if (req.method === 'POST') {
    const { name, price } = req.body;
    if (!name || isNaN(price)) return res.status(400).json({ error: 'Valid name and price required' });

    const { data: item, error } = await supabaseAdmin
      .from('vendor_items')
      .insert({
        vendor_id: req.user.id,
        name,
        price: Number(price),
      })
      .select()
      .single();

    if (error) {
      console.error('Insert item error:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(item);
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

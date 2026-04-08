import { supabaseAdmin } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

// GET /api/store/items - fetch all vendor items for the student marketplace
export default requireAuth(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data: items, error } = await supabaseAdmin
    .from('vendor_items')
    .select(`
      id,
      name,
      price,
      created_at,
      vendor_id,
      users:vendor_id (name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch store items error:', error);
    return res.status(500).json({ error: error.message });
  }

  // Format the response slightly to make the frontend easier
  const formattedItems = items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    vendor_id: item.vendor_id,
    vendor_name: item.users?.name || 'Unknown Vendor'
  }));

  return res.json(formattedItems);
});

import { supabaseAdmin } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { action } = req.query;
  const userId = req.user.id;

  if (action === 'balance') {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('balance, name, email, role, student_id')
      .eq('id', userId)
      .single();
    return res.json(user);
  }

  if (action === 'history') {
    const { data: txs } = await supabaseAdmin
      .from('ledger')
      .select(`
        *,
        sender:from_user(name, student_id),
        receiver:to_user(name, student_id)
      `)
      .or(`from_user.eq.${userId},to_user.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);
    return res.json(txs || []);
  }

  if (action === 'users') {
    // Search students for P2P transfer
    const { q } = req.query;
    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, student_id, role')
      .neq('id', userId)
      .in('role', ['student']);
    if (q) {
      query = query.or(`name.ilike.%${q}%,student_id.ilike.%${q}%,email.ilike.%${q}%`);
    }
    const { data } = await query.limit(10);
    return res.json(data || []);
  }

  if (action === 'vendors') {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, name, student_id, email')
      .eq('role', 'vendor');
    return res.json(data || []);
  }

  return res.status(404).json({ error: 'Unknown wallet action' });
}

export default requireAuth(handler);

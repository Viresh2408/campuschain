import { requireAuth } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { createTransaction } from '../../../lib/blockchain';

async function handler(req, res) {
  const { action } = req.query;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (action === 'users') {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, balance, student_id, is_flagged, created_at')
      .order('created_at', { ascending: false });
    return res.json(data || []);
  }

  if (action === 'mint' && req.method === 'POST') {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount || amount <= 0) return res.status(400).json({ error: 'Invalid mint request' });

    const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const adminId = req.user.id;
    const { data: adminUser } = await supabaseAdmin.from('users').select('balance').eq('id', adminId).single();
    
    if (adminUser.balance < Number(amount)) {
      return res.status(400).json({ error: 'Admin has insufficient CampusCoin balance to mint' });
    }

    // Deduct from admin and credit to user
    await supabaseAdmin.from('users').update({ balance: adminUser.balance - Number(amount) }).eq('id', adminId);
    await supabaseAdmin.from('users').update({ balance: user.balance + Number(amount) }).eq('id', userId);

    const { tx, block } = await createTransaction({
      fromUser: req.user.id,
      toUser: userId,
      amount: Number(amount),
      type: 'mint',
      metadata: { reason: reason || 'Admin mint', mintedBy: req.user.name },
    });

    return res.json({ success: true, txId: tx.tx_id, blockHash: block?.block_hash, newBalance: user.balance + Number(amount) });
  }

  if (action === 'audit') {
    const { data } = await supabaseAdmin
      .from('ledger')
      .select(`
        *,
        sender:from_user(name, student_id, email),
        receiver:to_user(name, student_id, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);
    return res.json(data || []);
  }

  if (action === 'fraud-alerts') {
    const { data } = await supabaseAdmin
      .from('fraud_alerts')
      .select(`*, user:user_id(name, email, student_id)`)
      .order('created_at', { ascending: false })
      .limit(50);
    return res.json(data || []);
  }

  if (action === 'blocks') {
    const { data } = await supabaseAdmin
      .from('blocks')
      .select('*')
      .order('block_number', { ascending: false })
      .limit(20);
    return res.json(data || []);
  }

  if (action === 'stats') {
    const { count: userCount } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true });
    const { count: txCount } = await supabaseAdmin.from('ledger').select('*', { count: 'exact', head: true });
    const { count: blockCount } = await supabaseAdmin.from('blocks').select('*', { count: 'exact', head: true });
    const { count: alertCount } = await supabaseAdmin.from('fraud_alerts').select('*', { count: 'exact', head: true }).eq('resolved', false);
    const { data: volData } = await supabaseAdmin.from('ledger').select('amount');
    const totalVolume = volData?.reduce((s, t) => s + t.amount, 0) || 0;
    return res.json({ userCount, txCount, blockCount, alertCount, totalVolume });
  }

  return res.status(404).json({ error: 'Unknown admin action' });
}

export default requireAuth(handler);

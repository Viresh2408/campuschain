import { requireAuth } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

async function handler(req, res) {
  const userId = req.user.id;
  const { range = '30' } = req.query;
  const daysAgo = new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString();

  const { data: txs } = await supabaseAdmin
    .from('ledger')
    .select('amount, type, created_at, to_user, from_user')
    .eq('from_user', userId)
    .gte('created_at', daysAgo)
    .order('created_at', { ascending: true });

  const txList = txs || [];

  // Spend by category
  const byCategory = {};
  for (const tx of txList) {
    const cat = tx.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    byCategory[cat] = (byCategory[cat] || 0) + tx.amount;
  }
  const spendByCategory = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  // Daily volume (last N days)
  const dailyMap = {};
  for (const tx of txList) {
    const day = tx.created_at.split('T')[0];
    dailyMap[day] = (dailyMap[day] || 0) + tx.amount;
  }
  const dailyVolume = Object.entries(dailyMap)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top recipients (for student view - only out-txs)
  const recipientMap = {};
  for (const tx of txList.filter(t => t.to_user)) {
    recipientMap[tx.to_user] = (recipientMap[tx.to_user] || 0) + tx.amount;
  }

  // Fetch names for top recipients
  const topIds = Object.entries(recipientMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  let topRecipients = [];
  if (topIds.length) {
    const { data: recvUsers } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .in('id', topIds);
    topRecipients = topIds.map(id => ({
      name: recvUsers?.find(u => u.id === id)?.name || 'Unknown',
      amount: recipientMap[id],
    }));
  }

  // Summary stats
  const totalSpent = txList.reduce((s, t) => s + t.amount, 0);
  const txCount = txList.length;

  return res.json({ spendByCategory, dailyVolume, topRecipients, totalSpent, txCount });
}

export default requireAuth(handler);

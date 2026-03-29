import { supabaseAdmin } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  // Top 10 wallets by balance (leaderboard)
  const { data: top } = await supabaseAdmin
    .from('users')
    .select('id, name, student_id, role, balance')
    .order('balance', { ascending: false })
    .limit(10);

  // Total volume per user (money sent)
  const { data: txVol } = await supabaseAdmin
    .from('ledger')
    .select('from_user, amount')
    .neq('type', 'mint');

  const volMap = {};
  for (const tx of txVol || []) {
    if (tx.from_user) volMap[tx.from_user] = (volMap[tx.from_user] || 0) + tx.amount;
  }

  // Most transactions user
  const { data: txCount } = await supabaseAdmin
    .from('ledger')
    .select('from_user');

  const countMap = {};
  for (const tx of txCount || []) {
    if (tx.from_user) countMap[tx.from_user] = (countMap[tx.from_user] || 0) + 1;
  }

  const current = req.user.id;
  const myRank = top?.findIndex(u => u.id === current) + 1;

  return res.json({
    topBalances: (top || []).map((u, i) => ({
      rank: i + 1,
      name: u.name,
      student_id: u.student_id,
      role: u.role,
      balance: u.balance,
      volume: volMap[u.id] || 0,
      txCount: countMap[u.id] || 0,
      isMe: u.id === current,
    })),
    myRank: myRank || null,
  });
}

export default requireAuth(handler);

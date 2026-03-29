import { supabaseAdmin } from './supabase';

// Rule-based fraud detection engine
// Input: { userId, amount, type, toUser }
// Output: { isSuspect, reason, severity }

export async function detectFraud({ userId, amount, type, toUser }) {
  const flags = [];

  // Get user's last 30 days transactions
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: history } = await supabaseAdmin
    .from('ledger')
    .select('amount, created_at, to_user')
    .eq('from_user', userId)
    .gte('created_at', thirtyDaysAgo);

  const avgAmount = history?.length
    ? history.reduce((s, t) => s + t.amount, 0) / history.length
    : 0;

  // Rule 1: Large transaction (>3x average or >5000 CC flat)
  if (avgAmount > 0 && amount > avgAmount * 3) {
    flags.push({ reason: `Amount ${amount} CC is 3× your average (${avgAmount.toFixed(0)} CC)`, severity: 'high' });
  }
  if (amount > 5000) {
    flags.push({ reason: `Large transaction: ${amount} CC exceeds 5,000 CC threshold`, severity: 'medium' });
  }

  // Rule 2: Rapid transactions (>5 in last 10 minutes)
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recentTxs = history?.filter(t => t.created_at >= tenMinAgo) || [];
  if (recentTxs.length >= 5) {
    flags.push({ reason: `Rapid activity: ${recentTxs.length} transactions in last 10 minutes`, severity: 'high' });
  }

  // Rule 3: First-time large transfer to unknown recipient
  if (toUser && amount > 1000) {
    const prevToUser = history?.filter(t => t.to_user === toUser) || [];
    if (prevToUser.length === 0) {
      flags.push({ reason: `First-time transfer of ${amount} CC to new recipient`, severity: 'medium' });
    }
  }

  // Rule 4: Unusually round amount (possible layering)
  if (amount >= 1000 && amount % 1000 === 0 && amount > 3000) {
    flags.push({ reason: `Suspicious round amount: ${amount} CC`, severity: 'low' });
  }

  const isSuspect = flags.length > 0;
  const highestSeverity = flags.find(f => f.severity === 'high')
    ? 'high'
    : flags.find(f => f.severity === 'medium')
    ? 'medium'
    : 'low';

  if (isSuspect) {
    // Store fraud alert
    await supabaseAdmin.from('fraud_alerts').insert({
      user_id: userId,
      reason: flags.map(f => f.reason).join('; '),
      severity: highestSeverity,
    });

    // Flag transaction in ledger (latest)
    await supabaseAdmin
      .from('ledger')
      .update({ is_flagged: true, flag_reason: flags[0].reason })
      .eq('from_user', userId)
      .order('created_at', { ascending: false })
      .limit(1);
  }

  return { isSuspect, flags, severity: highestSeverity };
}

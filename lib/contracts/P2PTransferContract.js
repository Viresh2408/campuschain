import { supabaseAdmin } from '../supabase';
import { createTransaction } from '../blockchain';

// P2P Transfer smart contract
// Input:  { fromId, toId, amount, memo }
// Output: { txId, blockHash, fromBalance, toBalance }
export async function P2PTransferContract({ fromId, toId, amount, memo = '' }) {
  if (fromId === toId) throw new Error('Cannot transfer to yourself');
  if (amount <= 0) throw new Error('Invalid amount');
  if (amount > 10000) throw new Error('Exceeds single transaction limit (10,000 CC)');

  const { data: sender } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', fromId)
    .single();

  const { data: receiver } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', toId)
    .single();

  if (!sender) throw new Error('Sender not found');
  if (!receiver) throw new Error('Receiver not found');
  if (sender.balance < amount) throw new Error('Insufficient balance');

  // Check daily transfer limit (20,000 CC/day)
  const today = new Date().toISOString().split('T')[0];
  const { data: todayTxs } = await supabaseAdmin
    .from('ledger')
    .select('amount')
    .eq('from_user', fromId)
    .eq('type', 'p2p_transfer')
    .gte('created_at', `${today}T00:00:00`);

  const dailyTotal = todayTxs?.reduce((sum, t) => sum + t.amount, 0) || 0;
  if (dailyTotal + amount > 20000) throw new Error('Daily P2P transfer limit (20,000 CC) exceeded');

  // Execute transfer
  await supabaseAdmin.from('users').update({ balance: sender.balance - amount }).eq('id', fromId);
  await supabaseAdmin.from('users').update({ balance: receiver.balance + amount }).eq('id', toId);

  const { tx, block } = await createTransaction({
    fromUser: fromId,
    toUser: toId,
    amount,
    type: 'p2p_transfer',
    metadata: { memo, senderName: sender.name, receiverName: receiver.name },
  });

  return {
    txId: tx.tx_id,
    blockHash: block?.block_hash,
    blockNumber: block?.block_number,
    fromBalance: sender.balance - amount,
    toBalance: receiver.balance + amount,
    receiver: { name: receiver.name, studentId: receiver.student_id },
  };
}

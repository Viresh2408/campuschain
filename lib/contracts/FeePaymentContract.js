import { supabaseAdmin } from '../supabase';
import { createTransaction } from '../blockchain';

// FeePayment smart contract
// Input:  { userId, amount, feeType }
// Output: { txId, blockHash, receipt, updatedBalance }
export async function FeePaymentContract({ userId, amount, feeType }) {
  // 1. Get student wallet
  const { data: user, error: userErr } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userErr || !user) throw new Error('User not found');
  if (user.balance < amount) throw new Error('Insufficient CampusCoin balance');
  if (amount <= 0) throw new Error('Invalid amount');

  // 2. Get university admin wallet
  const { data: admin } = await supabaseAdmin
    .from('users')
    .select('id, balance')
    .eq('role', 'admin')
    .limit(1)
    .single();

  // 3. Deduct from student
  await supabaseAdmin
    .from('users')
    .update({ balance: user.balance - amount })
    .eq('id', userId);

  // 4. Credit to admin/university
  if (admin) {
    await supabaseAdmin
      .from('users')
      .update({ balance: admin.balance + amount })
      .eq('id', admin.id);
  }

  // 5. Create blockchain transaction
  const { tx, block } = await createTransaction({
    fromUser: userId,
    toUser: admin?.id || null,
    amount,
    type: 'fee_payment',
    metadata: { feeType, studentId: user.student_id },
  });

  return {
    txId: tx.tx_id,
    blockHash: block?.block_hash,
    blockNumber: block?.block_number,
    receipt: {
      studentName: user.name,
      amount,
      feeType,
      timestamp: tx.created_at,
      status: 'CONFIRMED',
    },
    updatedBalance: user.balance - amount,
  };
}

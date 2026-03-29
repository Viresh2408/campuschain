import { supabaseAdmin } from '../supabase';
import { createTransaction } from '../blockchain';

// Vendor Payment smart contract
// Input:  { vendorId, studentId, amount, qrData }
// Output: { txId, blockHash, vendorBalance, studentBalance }
export async function VendorPaymentContract({ vendorId, studentId, amount, qrData }) {
  if (amount <= 0) throw new Error('Invalid amount');

  const { data: student } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', studentId)
    .single();

  const { data: vendor } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', vendorId)
    .single();

  if (!student) throw new Error('Student not found');
  if (!vendor || vendor.role !== 'vendor') throw new Error('Invalid vendor');
  if (student.balance < amount) throw new Error('Insufficient balance');

  await supabaseAdmin.from('users').update({ balance: student.balance - amount }).eq('id', studentId);
  await supabaseAdmin.from('users').update({ balance: vendor.balance + amount }).eq('id', vendorId);

  const { tx, block } = await createTransaction({
    fromUser: studentId,
    toUser: vendorId,
    amount,
    type: 'vendor_payment',
    metadata: { vendorName: vendor.name, qrData, studentId: student.student_id },
  });

  return {
    txId: tx.tx_id,
    blockHash: block?.block_hash,
    blockNumber: block?.block_number,
    vendorName: vendor.name,
    studentBalance: student.balance - amount,
    vendorBalance: vendor.balance + amount,
  };
}

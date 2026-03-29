import { supabaseAdmin } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { action } = req.query;

  if (action === 'list') {
    const filter = req.user.role === 'admin'
      ? supabaseAdmin.from('token_requests').select('*, requester:user_id(name, email, student_id, balance)').order('created_at', { ascending: false })
      : supabaseAdmin.from('token_requests').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    const { data } = await filter.limit(50);
    return res.json(data || []);
  }

  if (action === 'request' && req.method === 'POST') {
    const { amount, reason } = req.body;
    if (!amount || amount <= 0 || amount > 5000) return res.status(400).json({ error: 'Amount must be 1–5000 CC' });
    const { data, error } = await supabaseAdmin.from('token_requests').insert({
      user_id: req.user.id,
      amount: Number(amount),
      reason: reason || 'Top-up request',
      status: 'pending',
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (action === 'approve' && req.method === 'POST') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { requestId } = req.body;
    const { data: request } = await supabaseAdmin.from('token_requests').select('*, requester:user_id(name, balance)').eq('id', requestId).single();
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    // Import blockchain here to avoid circular deps
    const { createTransaction } = require('../../../lib/blockchain');
    
    // Check admin balance first
    const adminId = req.user.id;
    const { data: adminUser } = await supabaseAdmin.from('users').select('balance').eq('id', adminId).single();
    if (adminUser.balance < request.amount) {
      return res.status(400).json({ error: 'Admin has insufficient balance to approve this request' });
    }

    // Deduct from admin and credit to requester
    await supabaseAdmin.from('users').update({ balance: adminUser.balance - request.amount }).eq('id', adminId);
    await supabaseAdmin.from('users').update({ balance: request.requester.balance + request.amount }).eq('id', request.user_id);
    await supabaseAdmin.from('token_requests').update({ status: 'approved' }).eq('id', requestId);
    await createTransaction({ fromUser: adminId, toUser: request.user_id, amount: request.amount, type: 'mint', metadata: { reason: request.reason, via: 'token_request' } });
    return res.json({ success: true, message: `Approved ${request.amount} CC for ${request.requester.name}` });
  }

  if (action === 'reject' && req.method === 'POST') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { requestId } = req.body;
    await supabaseAdmin.from('token_requests').update({ status: 'rejected' }).eq('id', requestId);
    return res.json({ success: true });
  }

  return res.status(404).json({ error: 'Unknown action' });
}

export default requireAuth(handler);

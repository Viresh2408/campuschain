import { requireAuth } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

async function handler(req, res) {
  const { action } = req.query;

  if (action === 'list' && req.method === 'GET') {
    const { data } = await supabaseAdmin
      .from('events')
      .select('*, created_by_user:created_by(name)')
      .order('event_date', { ascending: true });
    return res.json(data || []);
  }

  if (action === 'create' && req.method === 'POST') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { title, description, venue, event_date, ticket_price, total_tickets } = req.body;
    if (!title || !event_date || !ticket_price || !total_tickets)
      return res.status(400).json({ error: 'Missing required fields' });

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({ title, description, venue, event_date, ticket_price, total_tickets, created_by: req.user.id })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (action === 'my-tickets' && req.method === 'GET') {
    const { data } = await supabaseAdmin
      .from('tickets')
      .select('*, event:event_id(title, venue, event_date, ticket_price)')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });
    return res.json(data || []);
  }

  return res.status(404).json({ error: 'Unknown event action' });
}

export default requireAuth(handler);

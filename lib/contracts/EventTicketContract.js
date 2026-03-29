import { supabaseAdmin } from '../supabase';
import { createTransaction } from '../blockchain';
import crypto from 'crypto';

// EventTicket smart contract (NFT-like)
// Input:  { eventId, studentId, ticketCount }
// Output: { ticketTokens[], txId, blockHash, updatedBalance }
export async function EventTicketContract({ eventId, studentId, ticketCount = 1 }) {
  if (ticketCount < 1 || ticketCount > 5) throw new Error('Ticket count must be 1–5');

  const { data: event } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!event) throw new Error('Event not found');
  if (event.sold_tickets + ticketCount > event.total_tickets)
    throw new Error('Not enough tickets available');

  const { data: student } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', studentId)
    .single();

  if (!student) throw new Error('Student not found');

  const totalCost = event.ticket_price * ticketCount;
  if (student.balance < totalCost) throw new Error('Insufficient balance');

  // Deduct from student
  await supabaseAdmin
    .from('users')
    .update({ balance: student.balance - totalCost })
    .eq('id', studentId);

  // Credit to event creator (usually admin)
  if (event.created_by) {
    const { data: creator } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', event.created_by)
      .single();
    if (creator) {
      await supabaseAdmin
        .from('users')
        .update({ balance: creator.balance + totalCost })
        .eq('id', event.created_by);
    }
  }

  // Update sold tickets
  await supabaseAdmin
    .from('events')
    .update({ sold_tickets: event.sold_tickets + ticketCount })
    .eq('id', eventId);

  const { tx, block } = await createTransaction({
    fromUser: studentId,
    toUser: event.created_by,
    amount: totalCost,
    type: 'event_ticket',
    metadata: { eventTitle: event.title, ticketCount, eventId },
  });

  // Issue ticket tokens (NFT-like)
  const ticketTokens = [];
  for (let i = 0; i < ticketCount; i++) {
    const token = 'TKT-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    await supabaseAdmin.from('tickets').insert({
      ticket_token: token,
      event_id: eventId,
      owner_id: studentId,
      tx_id: tx.tx_id,
    });
    ticketTokens.push(token);
  }

  return {
    ticketTokens,
    txId: tx.tx_id,
    blockHash: block?.block_hash,
    blockNumber: block?.block_number,
    eventTitle: event.title,
    totalCost,
    updatedBalance: student.balance - totalCost,
  };
}

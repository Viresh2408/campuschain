import { supabaseAdmin } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';

// GET /api/admin/setup — seeds demo data (tables must already exist)
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const results = [];

  // 1. Seed users
  try {
    const hash = await bcrypt.hash('admin123', 10);

    const seedUsers = [
      { name: 'Admin', email: 'admin@campus.edu', password_hash: hash, role: 'admin', balance: 99999, student_id: 'ADM001' },
      { name: 'Campus Cafeteria', email: 'cafeteria@campus.edu', password_hash: hash, role: 'vendor', balance: 0, student_id: 'VND001' },
      { name: 'Campus Store', email: 'store@campus.edu', password_hash: hash, role: 'vendor', balance: 0, student_id: 'VND002' },
      { name: 'Rahul Sharma', email: 'rahul@campus.edu', password_hash: hash, role: 'student', balance: 500, student_id: 'STU001' },
      { name: 'Priya Singh', email: 'priya@campus.edu', password_hash: hash, role: 'student', balance: 1200, student_id: 'STU002' },
    ];

    for (const u of seedUsers) {
      // Try insert first; if conflict, update password_hash
      const { error } = await supabaseAdmin
        .from('users')
        .upsert(u, { onConflict: 'email', ignoreDuplicates: false });

      if (error) {
        results.push(`⚠️ user ${u.email}: ${error.message}`);
      } else {
        results.push(`✅ user seeded: ${u.email}`);
      }
    }
  } catch (e) {
    results.push(`❌ seed users failed: ${e.message}`);
  }

  // 2. Seed genesis block
  try {
    const { error } = await supabaseAdmin.from('blocks').upsert({
      block_number: 0,
      block_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      prev_hash: 'GENESIS',
      merkle_root: 'GENESIS_MERKLE_ROOT',
      nonce: 0,
      tx_count: 0,
    }, { onConflict: 'block_number', ignoreDuplicates: true });

    results.push(error ? `⚠️ genesis block: ${error.message}` : '✅ genesis block ready');
  } catch (e) {
    results.push(`❌ genesis block: ${e.message}`);
  }

  // 3. Seed events (only if no events exist)
  try {
    const { data: existingEvents } = await supabaseAdmin.from('events').select('id').limit(1);
    if (!existingEvents?.length) {
      const { data: admin } = await supabaseAdmin.from('users').select('id').eq('role', 'admin').limit(1).single();
      if (admin) {
        const sampleEvents = [
          {
            title: 'Tech Fest 2024',
            description: 'Annual technology festival with hackathons, workshops, and keynote speakers.',
            venue: 'Main Auditorium',
            event_date: new Date(Date.now() + 7 * 86400000).toISOString(),
            ticket_price: 50,
            total_tickets: 200,
            created_by: admin.id,
          },
          {
            title: 'Cultural Night',
            description: 'A spectacular evening of music, dance, and performances by students.',
            venue: 'Open Air Theatre',
            event_date: new Date(Date.now() + 14 * 86400000).toISOString(),
            ticket_price: 25,
            total_tickets: 500,
            created_by: admin.id,
          },
        ];
        for (const ev of sampleEvents) {
          const { error } = await supabaseAdmin.from('events').insert(ev);
          results.push(error ? `⚠️ event: ${error.message}` : `✅ event created: ${ev.title}`);
        }
      }
    } else {
      results.push('✅ events already exist, skipped');
    }
  } catch (e) {
    results.push(`❌ events: ${e.message}`);
  }

  return res.json({
    message: 'Seed complete!',
    results,
    credentials: {
      admin: 'admin@campus.edu / admin123',
      vendor: 'cafeteria@campus.edu / admin123',
      student1: 'rahul@campus.edu / admin123',
      student2: 'priya@campus.edu / admin123',
    },
  });
}

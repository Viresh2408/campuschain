import bcrypt from 'bcrypt';
import { supabaseAdmin } from '../../../lib/supabase';
import { signToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action } = req.query;

    if (action === 'login') {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: user.balance, student_id: user.student_id },
      });
    }

    if (action === 'register') {
      const { name, email, password, role = 'student', student_id } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const password_hash = await bcrypt.hash(password, 10);
      const sid = student_id || role.toUpperCase().slice(0, 3) + Math.floor(Math.random() * 90000 + 10000);

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .insert({ name, email: email.toLowerCase(), password_hash, role, student_id: sid, balance: 0 })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
      return res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: 0, student_id: user.student_id },
      });
    }

    return res.status(404).json({ error: 'Unknown action' });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

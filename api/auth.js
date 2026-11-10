import { pool } from './_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { pathname } = new URL(req.url, `https://${req.headers.host}`);
  
  // Safely parse body
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  
  const { email, password } = body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    if (pathname === '/auth/register-password') {
      await pool.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, crypt($2, gen_salt('bf', 10)))
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [normalizedEmail, password]
      );
      return res.status(200).json({ ok: true });
    }

    if (pathname === '/auth/verify-password') {
      const result = await pool.query(
        `SELECT password_hash = crypt($1, password_hash) AS ok
         FROM users
         WHERE email = $2`,
        [password, normalizedEmail]
      );

      if (result.rows.length === 0 || result.rows[0].ok !== true) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(404).json({ message: 'Not found' });
  } catch (err) {
    console.error('AUTH API ERROR:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
// api/user.js
import { pool } from './_lib/db.js'; // <-- Curly braces here

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.method === 'GET' ? req.query : req.body;
  const { privyUserId, email, walletAddress } = data || {};

  if (!privyUserId) {
    return res.status(400).json({ error: 'privyUserId is required' });
  }

  try {
    const result = await pool.query( // <-- pool.query here
      `INSERT INTO users (privy_user_id, email, wallet_address)
       VALUES ($1, $2, $3)
       ON CONFLICT (privy_user_id)
       DO UPDATE SET email = EXCLUDED.email, wallet_address = EXCLUDED.wallet_address
       RETURNING *`,
      [privyUserId, email ?? null, walletAddress ?? null]
    );

    return res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: err.message });
  }
}
import pool from './_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { privyUserId, pushToken } = req.body || {};

  if (!privyUserId || !pushToken) {
    return res.status(400).json({ error: 'Missing privyUserId or pushToken' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET push_token = \ WHERE privy_user_id = \ RETURNING id',
      [pushToken, privyUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Register push error:', err);
    return res.status(500).json({ error: err.message });
  }
}

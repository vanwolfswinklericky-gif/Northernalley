// api/transactions.js
import pool from './_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { privyUserId, limit = 50, type } = req.query;

  if (!privyUserId) {
    return res.status(400).json({ error: 'privyUserId is required' });
  }

  try {
    const params = [privyUserId];
    let query = `
      SELECT t.id, t.type, t.amount_usd, t.status, t.created_at
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      WHERE u.privy_user_id = $1
    `;

    if (type && type !== 'all') {
      params.push(type);
      query += ` AND t.type = $${params.length}`;
    }

    params.push(parseInt(limit, 10));
    query += ` ORDER BY t.created_at DESC LIMIT $${params.length}`;

    const { rows } = await pool.query(query, params);
    return res.status(200).json({ transactions: rows });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: err.message });
  }
}
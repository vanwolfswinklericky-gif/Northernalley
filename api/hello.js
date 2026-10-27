import pool from './_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const result = await pool.query('SELECT NOW() AS now');
    return res.status(200).json({ ok: true, message: 'Northernalley backend is live', time: result.rows[0].now });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

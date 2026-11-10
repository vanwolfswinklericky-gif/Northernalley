// api/user-data.js
import { pool } from './_lib/db.js';

export default async function handler(req, res) {
  // Set CORS headers globally for this combined function
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Determine which endpoint was called based on the URL path
  const { pathname } = new URL(req.url, `https://${req.headers.host}`);

  // 1. HELLO ENDPOINT LOGIC
  if (pathname === '/api/hello') {
    try {
      const result = await pool.query('SELECT NOW() AS now');
      return res.status(200).json({ 
        ok: true, 
        message: 'Northernalley backend is live', 
        time: result.rows[0].now 
      });
    } catch (err) {
      console.error('DB error:', err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 2. ME ENDPOINT LOGIC
  if (pathname === '/api/me') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const privyUserId = req.query.privyUserId;
    if (!privyUserId) {
      return res.status(400).json({ error: 'privyUserId is required' });
    }

    try {
      const result = await pool.query(
        `SELECT 
          u.id, u.privy_user_id, u.email, u.wallet_address, u.push_token,
          s.plan, s.status, s.current_period_end, s.add_ons
         FROM users u
         LEFT JOIN subscriptions s ON s.user_id = u.id
         WHERE u.privy_user_id = $1
         ORDER BY s.created_at DESC
         LIMIT 1`,
        [privyUserId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const row = result.rows[0];
      return res.status(200).json({
        user: {
          id: row.id,
          privyUserId: row.privy_user_id,
          email: row.email,
          walletAddress: row.wallet_address,
        },
        subscription: row.plan ? {
          plan: row.plan,
          status: row.status,
          currentPeriodEnd: row.current_period_end,
        } : null,
      });
    } catch (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback if the route doesn't match
  return res.status(404).json({ error: 'Not found' });
}
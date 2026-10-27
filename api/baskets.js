import pool from './_lib/db.js';
import { canAddBasket, PLAN_LIMITS } from './_lib/plan-limits.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { privyUserId } = req.query;

  if (!privyUserId) {
    return res.status(400).json({ error: 'privyUserId is required' });
  }

  try {
    // 1. Look up the user and their plan
    const userResult = await pool.query(
      \SELECT u.id, s.plan \n       FROM users u \n       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active' \n       WHERE u.privy_user_id = \ \n       ORDER BY s.created_at DESC LIMIT 1\,
      [privyUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;
    const plan = userResult.rows[0].plan || 'starter';

    // 2. GET: list all available baskets + user's usage
    if (req.method === 'GET') {
      const allBaskets = await pool.query(
        \SELECT id, slug, name, description, type, coins \n         FROM baskets \n         WHERE type = 'prebuilt' OR owner_id = \ \n         ORDER BY type DESC, created_at ASC\,
        [userId]
      );

      const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

      return res.status(200).json({
        baskets: allBaskets.rows,
        plan,
        limits,
        usage: {
          total: allBaskets.rows.filter((b) => b.type === 'custom').length,
          custom: allBaskets.rows.filter((b) => b.type === 'custom').length,
        },
      });
    }

    // 3. POST: create a custom basket
    if (req.method === 'POST') {
      const { name, coins } = req.body || {};

      if (!name || !Array.isArray(coins) || coins.length === 0) {
        return res.status(400).json({ error: 'name and coins are required' });
      }

      const total = coins.reduce((sum, c) => sum + (c.weight ?? 0), 0);
      if (Math.abs(total - 1.0) > 0.01) {
        return res.status(400).json({ error: 'Coin weights must sum to 1.0' });
      }

      const countResult = await pool.query(
        \SELECT COUNT(*)::int AS count FROM baskets WHERE owner_id = \\,
        [userId]
      );
      const currentCount = countResult.rows[0].count;

      const check = canAddBasket(plan, currentCount, 'custom');
      if (!check.allowed) {
        return res.status(403).json({ error: check.reason, code: 'PLAN_LIMIT' });
      }

      const inserted = await pool.query(
        \INSERT INTO baskets (name, description, type, owner_id, coins) \n         VALUES (\, \, 'custom', \, \) \n         RETURNING id, name, description, type, coins\,
        [name, 'Custom basket', userId, JSON.stringify(coins)]
      );

      return res.status(201).json({ basket: inserted.rows[0] });
    }

    // 4. DELETE: remove a custom basket
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'basket id is required' });

      const result = await pool.query(
        \DELETE FROM baskets \n         WHERE id = \ AND owner_id = \ AND type = 'custom' \n         RETURNING id\,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Basket not found' });
      }
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Baskets error:', err);
    return res.status(500).json({ error: err.message });
  }
}


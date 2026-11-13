// api/baskets.js
import { pool } from './_lib/db.js';
import { canAddBasket, PLAN_LIMITS } from './_lib/plan-limits.js';
import { normalizeEthUsdcWeights } from './_lib/basket-weights.js';

const WITHDRAWAL_FEE_RATE = 0.02; // 2% Fee on Withdrawals

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
    // 1. Look up the user, plan, and add-ons
    const userResult = await pool.query(
      `SELECT u.id, s.plan, s.add_ons 
       FROM users u 
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active' 
       WHERE u.privy_user_id = $1 
       ORDER BY s.created_at DESC LIMIT 1`,
      [privyUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;
    const plan = userResult.rows[0].plan || 'starter';
    
    // Parse the comma-separated add_ons string into a boolean object
    const rawAddOns = userResult.rows[0].add_ons || '';
    const userAddOns = {
      extraBasket: rawAddOns.includes('extraBasket'),
      weeklyDca: rawAddOns.includes('weeklyDca'),
      prioritySupport: rawAddOns.includes('prioritySupport'),
    };

    // 2. GET: list all available baskets + user's usage
    if (req.method === 'GET') {
      const allBaskets = await pool.query(
        `SELECT id, slug, name, description, type, coins 
         FROM baskets 
         WHERE type = 'prebuilt' OR owner_id = $1 
         ORDER BY type DESC, created_at ASC`,
        [userId]
      );

      const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

      return res.status(200).json({
        baskets: allBaskets.rows.map((basket) => ({
          ...basket,
          coins: normalizeEthUsdcWeights(basket.coins),
        })),
        plan,
        limits,
        usage: {
          total: allBaskets.rows.filter((b) => b.type === 'custom').length,
          custom: allBaskets.rows.filter((b) => b.type === 'custom').length,
        },
      });
    }

    // 3. POST: Handle both Withdrawals and Basket Creation
    if (req.method === 'POST') {
      const body = req.body || {};

      // --- WITHDRAWAL LOGIC ---
      if (body.action === 'withdraw') {
        const { amount, destinationAddress } = body;

        if (!amount || !destinationAddress) {
          return res.status(400).json({ error: 'amount and destinationAddress are required' });
        }

        const grossAmount = Number(amount);
        const withdrawalFee = grossAmount * WITHDRAWAL_FEE_RATE;
        const netAmountToSend = grossAmount - withdrawalFee;

        if (netAmountToSend <= 0) {
          return res.status(400).json({ error: 'Amount too small after fees' });
        }

        // Record the withdrawal request in Neon
        const { rows } = await pool.query(
          `INSERT INTO transactions (user_id, type, amount_usd, status, metadata)
           VALUES ($1, 'withdrawal', $2, 'pending', $3)
           RETURNING id`,
          [
            userId, 
            grossAmount, 
            JSON.stringify({ withdrawalFee, netAmountToSend, destinationAddress })
          ]
        );

        return res.status(200).json({ 
          success: true, 
          transactionId: rows[0].id,
          grossAmount,
          feeDeducted: withdrawalFee,
          netAmountSent: netAmountToSend
        });
      }

      // --- BASKET CREATION LOGIC ---
      const { name, coins } = body;

      if (!name || !Array.isArray(coins) || coins.length === 0) {
        return res.status(400).json({ error: 'name and coins are required' });
      }

      const total = coins.reduce((sum, c) => sum + (c.weight ?? 0), 0);
      if (Math.abs(total - 1.0) > 0.01) {
        return res.status(400).json({ error: 'Coin weights must sum to 1.0' });
      }

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS count FROM baskets WHERE owner_id = $1 AND type = 'custom'`,
        [userId]
      );
      const currentCount = countResult.rows[0].count;

      // Pass userAddOns to the limit checker
      const check = canAddBasket(plan, currentCount, 'custom', userAddOns);
      if (!check.allowed) {
        return res.status(403).json({ error: check.reason, code: 'PLAN_LIMIT' });
      }

      const inserted = await pool.query(
        `INSERT INTO baskets (name, description, type, owner_id, coins) 
         VALUES ($1, $2, 'custom', $3, $4) 
         RETURNING id, name, description, type, coins`,
        [name, 'Custom basket', userId, JSON.stringify(coins)]
      );

      return res.status(201).json({ basket: inserted.rows[0] });
    }

    // 4. DELETE: remove a custom basket
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'basket id is required' });

      const result = await pool.query(
        `DELETE FROM baskets 
         WHERE id = $1 AND owner_id = $2 AND type = 'custom' 
         RETURNING id`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Basket not found' });
      }
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Baskets/Withdrawal error:', err);
    return res.status(500).json({ error: err.message });
  }
}
// api/baskets.js

import { parseUnits } from 'viem';
import { verifyPrivyUser } from './_lib/auth-guard.js'; // <-- NEW IMPORT
import { normalizeBasketWeights } from './_lib/basket-weights.js';
import { pool } from './_lib/db.js';
import { executeSwapBatch } from './_lib/execute-swap.js';
import { canAddBasket, PLAN_LIMITS } from './_lib/plan-limits.js';
import { getSwapTransaction, resolveToken } from './_lib/swap.js';

const WITHDRAWAL_FEE_RATE = 0.02;
const DEPOSIT_FEE_RATE = 0.01;
const USDC_DECIMALS = 6;
const MIN_SWAP_USD = 1;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. ENFORCE SERVER-SIDE AUTH
  let privyUserId;
  try {
    privyUserId = await verifyPrivyUser(req);
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
  }

  try {
    const userResult = await pool.query(
      `SELECT u.id, u.wallet_address, s.plan, s.add_ons
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
    const walletAddress = userResult.rows[0].wallet_address;
    const plan = userResult.rows[0].plan || 'free';
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

    const rawAddOns = userResult.rows[0].add_ons || '';
    const userAddOns = {
      extraBasket: rawAddOns.includes('extraBasket'),
      weeklyDca: rawAddOns.includes('weeklyDca'),
      prioritySupport: rawAddOns.includes('prioritySupport'),
    };

    if (req.method === 'GET') {
      const allBaskets = await pool.query(
        `SELECT id, slug, name, description, type, coins
         FROM baskets
         WHERE type = 'prebuilt' OR owner_id = $1
         ORDER BY type DESC, created_at ASC`,
        [userId]
      );

      return res.status(200).json({
        baskets: allBaskets.rows.map((basket) => ({
          ...basket,
          coins: normalizeBasketWeights(basket.slug, basket.coins),
        })),
        plan,
        limits,
        usage: {
          total: allBaskets.rows.filter((b) => b.type === 'custom').length,
          custom: allBaskets.rows.filter((b) => b.type === 'custom').length,
        },
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};

      // --- WITHDRAWAL ---
      if (body.action === 'withdraw') {
        const { amount, destinationAddress } = body;
        
        // 2. VALIDATE INPUT
        if (typeof amount !== 'number' || amount <= 0) {
          return res.status(400).json({ error: 'Invalid amount' });
        }
        if (typeof destinationAddress !== 'string' || destinationAddress.length < 10) {
          return res.status(400).json({ error: 'Invalid destination address' });
        }

        const grossAmount = amount;
        const withdrawalFee = grossAmount * WITHDRAWAL_FEE_RATE;
        const netAmountToSend = grossAmount - withdrawalFee;

        if (netAmountToSend <= 0) {
          return res.status(400).json({ error: 'Amount too small after fees' });
        }

        const { rows } = await pool.query(
          `INSERT INTO transactions (user_id, type, amount_usd, status, metadata)
           VALUES ($1, 'withdrawal', $2, 'pending', $3)
           RETURNING id`,
          [
            userId,
            grossAmount,
            JSON.stringify({ withdrawalFee, netAmountToSend, destinationAddress }),
          ]
        );

        return res.status(200).json({
          success: true,
          transactionId: rows[0].id,
          grossAmount,
          feeDeducted: withdrawalFee,
          netAmountSent: netAmountToSend,
        });
      }

      // --- INSTANT BUY (PREMIUM ONLY) ---
      if (body.action === 'instant_buy') {
        if (!limits.instantBuy) {
          return res.status(403).json({
            error: 'Instant buy is a Premium feature.',
            code: 'PLAN_LIMIT',
          });
        }

        if (!walletAddress) {
          return res.status(400).json({ error: 'Wallet not set up' });
        }

        const { basketId, amount } = body;
        const grossAmount = Number(amount);

        // 2. VALIDATE INPUT
        if (typeof basketId !== 'string' || !basketId) {
          return res.status(400).json({ error: 'Invalid basket ID' });
        }
        if (isNaN(grossAmount) || grossAmount <= 0) {
          return res.status(400).json({ error: 'Invalid amount' });
        }

        const { rows: basketRows } = await pool.query(
          `SELECT slug, coins FROM baskets WHERE id = $1`,
          [basketId]
        );

        if (basketRows.length === 0) {
          return res.status(404).json({ error: 'Basket not found' });
        }

        let basketAssets;
        try {
          basketAssets = normalizeBasketWeights(
            basketRows[0].slug,
            basketRows[0].coins,
          );
        } catch {
          return res.status(400).json({ error: 'Invalid basket data' });
        }

        const depositFee = grossAmount * DEPOSIT_FEE_RATE;
        const netAmount = grossAmount - depositFee;

        if (netAmount <= 0) {
          return res.status(400).json({ error: 'Amount too small after fees' });
        }

        let usdc;
        try {
          usdc = await resolveToken('USDC');
        } catch {
          return res.status(500).json({ error: 'Token resolution failed' });
        }

        const swaps = [];
        for (const asset of basketAssets) {
          const amountString = (netAmount * asset.weight).toFixed(USDC_DECIMALS);
          const usdcAmount = parseUnits(amountString, USDC_DECIMALS);

          if (usdcAmount < BigInt(MIN_SWAP_USD * 1_000_000)) continue;

          const targetToken = await resolveToken(asset.symbol);
          const swapData = await getSwapTransaction(
            usdc.address,
            targetToken.address,
            usdcAmount.toString(),
            walletAddress
          );

          swaps.push({
            symbol: asset.symbol,
            toToken: targetToken.address,
            usdcAmount: usdcAmount.toString(),
            transaction: swapData,
          });
        }

        if (swaps.length === 0) {
          return res.status(400).json({ error: 'Amount too small to execute any swaps' });
        }

        const executionId = `instant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { executed, failed } = await executeSwapBatch(swaps, {
          userId,
          executionId,
          walletAddress,
        });

        const { rows } = await pool.query(
          `INSERT INTO transactions (user_id, type, amount_usd, status, metadata)
           VALUES ($1, 'instant_buy', $2, $3, $4)
           RETURNING id`,
          [
            userId,
            grossAmount,
            failed.length === 0 ? 'completed' : executed.length === 0 ? 'failed' : 'partial',
            JSON.stringify({
              executionId,
              basketId,
              depositFee,
              netAmountInvested: netAmount,
              executed,
              failed,
            }),
          ]
        );

        return res.status(200).json({
          success: executed.length > 0,
          transactionId: rows[0].id,
          executionId,
          grossAmount,
          feeDeducted: depositFee,
          netAmountInvested: netAmount,
          executed: executed.length,
          failed: failed.length,
          message:
            failed.length === 0
              ? 'Instant buy completed.'
              : executed.length > 0
              ? 'Partial execution. Some swaps failed.'
              : 'Instant buy failed. Please try again.',
        });
      }

      // --- CREATE CUSTOM BASKET ---
      const { name, coins } = body;
      
      // 2. VALIDATE INPUT
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Basket name must be at least 2 characters' });
      }
      if (!Array.isArray(coins) || coins.length === 0) {
        return res.status(400).json({ error: 'Coins are required' });
      }

      const total = coins.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
      if (Math.abs(total - 1.0) > 0.01) {
        return res.status(400).json({ error: 'Coin weights must sum to 1.0' });
      }

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS count FROM baskets WHERE owner_id = $1 AND type = 'custom'`,
        [userId]
      );
      const currentCount = countResult.rows[0].count;

      const check = canAddBasket(plan, currentCount, 'custom', userAddOns);
      if (!check.allowed) {
        return res.status(403).json({ error: check.reason, code: 'PLAN_LIMIT' });
      }

      const inserted = await pool.query(
        `INSERT INTO baskets (name, description, type, owner_id, coins)
         VALUES ($1, $2, 'custom', $3, $4)
         RETURNING id, name, description, type, coins`,
        [name.trim(), 'Custom basket', userId, JSON.stringify(coins)]
      );

      return res.status(201).json({ basket: inserted.rows[0] });
    }

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
    console.error('Baskets/Withdrawal/InstantBuy error:', err);
    // 3. TRIM API RESPONSE (Don't leak SQL errors to frontend)
    return res.status(500).json({ error: 'Internal server error' });
  }
}
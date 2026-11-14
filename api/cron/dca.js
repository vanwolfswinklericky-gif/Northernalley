// api/cron/dca.js

import { normalizeEthUsdcWeights } from '../_lib/basket-weights.js';
import pool from '../_lib/db.js';
import { executeSwapBatch } from '../_lib/execute-swap.js';
import { getSwapTransaction, resolveToken } from '../_lib/swap.js';

const USDC_DECIMALS = 1_000_000;
const MIN_SWAP_USD = 1;
const MAX_PLANS_PER_RUN = 500;
const DEPOSIT_FEE_RATE = 0.01; // 1% Fee on every DCA Deposit

function log(level, message, context = {}) {
  const entry = { ts: new Date().toISOString(), level, service: 'dca-cron', message, ...context };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

function isDue(plan, lastExecuted) {
  if (!lastExecuted) return true;
  const daysSince = (Date.now() - new Date(lastExecuted).getTime()) / (1000 * 60 * 60 * 24);
  switch (plan.frequency) {
    case 'daily': return daysSince >= 1;
    case 'weekly': return daysSince >= 7;
    case 'monthly': return daysSince >= 28;
    default: return false;
  }
}

async function acquireLock(lockId) {
  const { rows } = await pool.query('SELECT pg_try_advisory_lock($1) AS acquired', [lockId]);
  return rows[0]?.acquired === true;
}

async function releaseLock(lockId) {
  await pool.query('SELECT pg_advisory_unlock($1)', [lockId]);
}

const DCA_LOCK_ID = 987654321;

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    log('warn', 'Unauthorized cron invocation');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const executionId = `dca-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const locked = await acquireLock(DCA_LOCK_ID);
  
  if (!locked) {
    log('warn', 'Skipped - lock held', { executionId });
    return res.status(200).json({ ok: true, skipped: true, reason: 'locked' });
  }

  try {
    log('info', 'DCA cron started', { executionId });

    const { rows: plans } = await pool.query(
      `
      SELECT
        u.id AS user_id,
        u.wallet_address,
        u.push_token,
        s.plan AS subscription_plan,
        d.id AS dca_plan_id,
        d.basket_id,
        d.amount_usd,
        d.frequency,
        d.last_executed_at
      FROM users u
      JOIN subscriptions s ON s.user_id = u.id
      JOIN dca_plans d ON d.user_id = u.id
      WHERE s.status = 'active'
        AND s.current_period_end > NOW()
        AND d.status = 'active'
        AND u.wallet_address IS NOT NULL
      ORDER BY d.last_executed_at ASC NULLS FIRST
      LIMIT $1
      `,
      [MAX_PLANS_PER_RUN]
    );

    log('info', 'Plans fetched', { executionId, total: plans.length });

    let usdc;
    try {
      usdc = await resolveToken('USDC');
    } catch (error) {
      log('error', 'Failed to resolve USDC - aborting', { executionId, error: error.message });
      return res.status(500).json({ ok: false, error: 'Token resolution failed' });
    }

    let processed = 0;
    let skipped = 0;
    const errors = [];

    for (const plan of plans) {
      if (!isDue(plan, plan.last_executed_at)) {
        skipped++;
        continue;
      }

      const { rows: existing } = await pool.query(
        `SELECT id FROM transactions
         WHERE user_id = $1
           AND type = 'dca_buy'
           AND created_at >= date_trunc('day', NOW())
           AND status IN ('completed', 'partial', 'pending')
         LIMIT 1`,
        [plan.user_id]
      );
      
      if (existing.length > 0) {
        skipped++;
        continue;
      }

      try {
        const { rows: basketRows } = await pool.query(
          `SELECT coins FROM baskets WHERE id = $1`,
          [plan.basket_id]
        );

        if (basketRows.length === 0) {
          log('warn', 'Basket not found - skipping', { executionId, userId: plan.user_id });
          skipped++;
          continue;
        }

        let basketAssets;
        try {
          const rawCoins = basketRows[0].coins;
          basketAssets = typeof rawCoins === 'string' ? JSON.parse(rawCoins) : rawCoins;
          basketAssets = normalizeEthUsdcWeights(basketAssets);
        } catch (e) {
          skipped++;
          continue;
        }

        // --- 1% DEPOSIT FEE CALCULATION ---
        const grossAmount = Number(plan.amount_usd);
        const depositFee = grossAmount * DEPOSIT_FEE_RATE;
        const netAmountToInvest = grossAmount - depositFee;

        if (netAmountToInvest <= 0) {
          skipped++;
          continue;
        }

        const swaps = [];
        for (const asset of basketAssets) {
          const usdcAmount = Math.floor(netAmountToInvest * asset.weight * USDC_DECIMALS);

          if (usdcAmount < MIN_SWAP_USD * USDC_DECIMALS) continue;

          const targetToken = await resolveToken(asset.symbol);
          const swapData = await getSwapTransaction(
            usdc.address, targetToken.address, usdcAmount.toString(), plan.wallet_address
          );

          swaps.push({
            symbol: asset.symbol,
            toToken: targetToken.address,
            usdcAmount,
            transaction: swapData,
          });
        }

        if (swaps.length === 0) {
          skipped++;
          continue;
        }

        const { executed, failed } = await executeSwapBatch(swaps, {
          userId: plan.user_id,
          executionId,
          walletAddress: plan.wallet_address,
        });

        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          await client.query(
            `INSERT INTO transactions (user_id, type, amount_usd, status, metadata)
             VALUES ($1, 'dca_buy', $2, $3, $4)`,
            [
              plan.user_id,
              grossAmount,
              failed.length === 0 ? 'completed' : 'partial',
              JSON.stringify({ 
                executionId, 
                grossAmount,
                depositFee,
                netAmountInvested: netAmountToInvest,
                executed, 
                failed 
              }),
            ]
          );

          if (executed.length > 0) {
            await client.query(
              `UPDATE dca_plans SET last_executed_at = NOW(), updated_at = NOW() WHERE id = $1`,
              [plan.dca_plan_id]
            );
          }
          await client.query('COMMIT');
        } catch (dbError) {
          await client.query('ROLLBACK');
          throw dbError;
        } finally {
          client.release();
        }

        if (plan.push_token && executed.length > 0) {
          sendPushNotification(plan, netAmountToInvest, executed, failed).catch((pushError) => {
            log('warn', 'Push notification failed', { executionId, error: pushError.message });
          });
        }

        processed++;
      } catch (planError) {
        log('error', 'Plan execution failed', { executionId, userId: plan.user_id, error: planError.message });
        errors.push({ userId: plan.user_id, error: planError.message });
      }
    }

    return res.status(200).json({ ok: true, executionId, processed, skipped, total: plans.length });
  } catch (error) {
    log('error', 'DCA cron fatal error', { executionId, error: error.message });
    return res.status(500).json({ ok: false, executionId, error: error.message });
  } finally {
    await releaseLock(DCA_LOCK_ID).catch((e) => log('error', 'Lock release failed', { error: e.message }));
  }
}

async function sendPushNotification(plan, netAmount, executed = [], failed = []) {
  const succeeded = executed.length;
  const total = succeeded + failed.length;

  let body = failed.length === 0 
    ? `Your €${netAmount.toFixed(2)} ETF investment was successful.`
    : `Investment partially failed. €${netAmount.toFixed(2)} processed.`;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      to: plan.push_token,
      sound: 'default',
      title: 'ETF Investment Executed',
      body,
      data: { screen: 'activity' },
    }),
  });
}
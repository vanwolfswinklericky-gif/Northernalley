// api/cron/dca.js

import pool from '../_lib/db.js';
import { executeSwapBatch } from '../_lib/execute-swap.js';
import { getSwapTransaction, resolveToken } from '../_lib/swap.js';

const USDC_DECIMALS = 1_000_000;
const MIN_SWAP_USD = 1;
const MAX_PLANS_PER_RUN = 500;

function log(level, message, context = {}) {
  const entry = { ts: new Date().toISOString(), level, service: 'dca-cron', message, ...context };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

function isDue(plan, lastExecuted) {
  if (!lastExecuted) return true;
  const daysSince =
    (Date.now() - new Date(lastExecuted).getTime()) / (1000 * 60 * 60 * 24);
  switch (plan.frequency) {
    case 'daily': return daysSince >= 1;
    case 'weekly': return daysSince >= 7;
    case 'monthly': return daysSince >= 28;
    default: return false;
  }
}

const BASKET_ASSETS = Object.freeze({
  top20: [
    { symbol: 'ETH', weight: 0.4 },
    { symbol: 'USDC', weight: 0.6 },
  ],
  btceth: [
    { symbol: 'ETH', weight: 0.5 },
    { symbol: 'USDC', weight: 0.5 },
  ],
  sol: [{ symbol: 'ETH', weight: 1.0 }],
  ada: [{ symbol: 'ETH', weight: 1.0 }],
});

function getBasketAssets(basketId) {
  const basket = BASKET_ASSETS[basketId];
  if (!basket) {
    log('warn', 'Unknown basket Ã¢â‚¬â€ defaulting to USDC', { basketId });
    return [{ symbol: 'USDC', weight: 1.0 }];
  }
  return basket;
}

async function acquireLock(lockId) {
  const { rows } = await pool.query(
    'SELECT pg_try_advisory_lock($1) AS acquired',
    [lockId]
  );
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
    log('warn', 'Skipped Ã¢â‚¬â€ lock held', { executionId });
    return res.status(200).json({ ok: true, skipped: true, reason: 'locked' });
  }

  try {
    log('info', 'DCA cron started', { executionId });

    // FIX: Fetch the user's session key (encrypted) alongside the plan
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
      log('error', 'Failed to resolve USDC Ã¢â‚¬â€ aborting', {
        executionId,
        error: error.message,
      });
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

      // FIX: Idempotency check Ã¢â‚¬â€ has this plan already been executed today?
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
        log('info', 'Plan already executed today Ã¢â‚¬â€ skipping', {
          executionId,
          userId: plan.user_id,
        });
        skipped++;
        continue;
      }

      try {
        const basketAssets = getBasketAssets(plan.basket_id);
        const swaps = [];

        for (const asset of basketAssets) {
          const usdcAmount = Math.floor(
            Number(plan.amount_usd) * asset.weight * USDC_DECIMALS
          );

          if (usdcAmount < MIN_SWAP_USD * USDC_DECIMALS) {
            log('info', 'Swap below minimum', {
              executionId,
              userId: plan.user_id,
              symbol: asset.symbol,
            });
            continue;
          }

          const targetToken = await resolveToken(asset.symbol);

          const swapData = await getSwapTransaction(
            usdc.address,
            targetToken.address,
            usdcAmount.toString(),
            plan.wallet_address
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

        // FIX: Pass the user's own session key Ã¢â‚¬â€ not a global one
        const { executed, failed } = await executeSwapBatch(swaps, {
          userId: plan.user_id,
          executionId,
          walletAddress: plan.wallet_address,
        });

        log('info', 'Swap batch executed', {
          executionId,
          userId: plan.user_id,
          executed: executed.length,
          failed: failed.length,
        });

        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          await client.query(
            `INSERT INTO transactions (user_id, type, amount_usd, status, metadata)
             VALUES ($1, 'dca_buy', $2, $3, $4)`,
            [
              plan.user_id,
              plan.amount_usd,
              failed.length === 0 ? 'completed' : 'partial',
              JSON.stringify({ executionId, executed, failed }),
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
          sendPushNotification(plan, executed, failed).catch((pushError) => {
            log('warn', 'Push notification failed', {
              executionId,
              userId: plan.user_id,
              error: pushError.message,
            });
          });
        }

        processed++;
      } catch (planError) {
        log('error', 'Plan execution failed', {
          executionId,
          userId: plan.user_id,
          dcaPlanId: plan.dca_plan_id,
          error: planError.message,
        });
        errors.push({ userId: plan.user_id, error: planError.message });
      }
    }

    log('info', 'DCA cron completed', {
      executionId,
      processed,
      skipped,
      errors: errors.length,
    });

    return res.status(200).json({
      ok: true,
      executionId,
      processed,
      skipped,
      total: plans.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    log('error', 'DCA cron fatal error', {
      executionId,
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ ok: false, executionId, error: error.message });
  } finally {
    await releaseLock(DCA_LOCK_ID).catch((releaseError) => {
      log('error', 'Failed to release lock', {
        executionId,
        error: releaseError.message,
      });
    });
  }
}

async function sendPushNotification(plan, executed = [], failed = []) {
  const succeeded = executed.length;
  const total = succeeded + failed.length;

  let body;
  if (failed.length === 0) {
    body = `Your $${Number(plan.amount_usd).toFixed(2)} investment was successful.`;
  } else if (succeeded === 0) {
    body = `Your $${Number(plan.amount_usd).toFixed(2)} investment failed. We'll retry shortly.`;
  } else {
    body = `${succeeded} of ${total} swaps completed for your $${Number(plan.amount_usd).toFixed(2)} investment.`;
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      to: plan.push_token,
      sound: 'default',
      title: 'DCA Executed',
      body,
      data: { screen: 'activity' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Push API returned ${response.status}`);
  }
}
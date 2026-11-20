// api/cron/dca.js

import Stripe from 'stripe';
import { parseUnits } from 'viem';
import { normalizeBasketWeights } from '../_lib/basket-weights.js';
import pool from '../_lib/db.js';
import { executeSwapBatch } from '../_lib/execute-swap.js';
import { calculateRebalanceSwaps } from '../_lib/rebalance.js';
import { getSwapTransaction, resolveToken } from '../_lib/swap.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const USDC_DECIMALS = 6;
const MIN_SWAP_USD = 1;
const MAX_PLANS_PER_RUN = 10; // Fixed: Prevent Vercel Timeout
const DEPOSIT_FEE_RATE = 0.01;

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
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const executionId = `dca-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const locked = await acquireLock(DCA_LOCK_ID);

  if (!locked) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'locked' });
  }

  try {
    log('info', 'DCA cron started', { executionId });

    // Fetch plans
    const { rows: plans } = await pool.query(
      `
      SELECT
        u.id AS user_id,
        u.wallet_address,
        u.push_token,
        s.plan AS subscription_plan,
        s.stripe_customer_id,
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
      log('error', 'Failed to resolve USDC - aborting', { error: error.message });
      return res.status(500).json({ ok: false, error: 'Token resolution failed' });
    }

    let processed = 0;
    let skipped = 0;
    let rebalanced = 0;
    const errors = [];

    for (const plan of plans) {
      if (!isDue(plan, plan.last_executed_at)) {
        skipped++;
        continue;
      }

      // Idempotency check
      const { rows: existing } = await pool.query(
        `SELECT id FROM transactions WHERE user_id = $1 AND type = 'dca_buy' AND created_at >= date_trunc('day', NOW()) LIMIT 1`,
        [plan.user_id]
      );

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      try {
        const { rows: basketRows } = await pool.query(`SELECT slug, coins FROM baskets WHERE id = $1`, [plan.basket_id]);
        if (basketRows.length === 0) { skipped++; continue; }

        let basketAssets;
        try {
          basketAssets = normalizeBasketWeights(
            basketRows[0].slug,
            basketRows[0].coins,
          );
        } catch (error) {
          log('warn', 'Invalid basket configuration; skipping DCA before charge', {
            userId: plan.user_id,
            error: error.message,
          });
          skipped++;
          continue;
        }

        const grossAmount = Number(plan.amount_usd);
        const depositFee = grossAmount * DEPOSIT_FEE_RATE;
        const totalToCharge = grossAmount + depositFee; // Charge investment + fee

        // --- 1. BUILD DCA SWAPS ---
        const netAmountToInvest = grossAmount - depositFee;
        const swaps = [];
        for (const asset of basketAssets) {
          const amountString = (netAmountToInvest * asset.weight).toFixed(USDC_DECIMALS);
          const usdcAmount = parseUnits(amountString, USDC_DECIMALS);

          if (usdcAmount < BigInt(MIN_SWAP_USD * 1_000_000)) continue;

          const targetToken = await resolveToken(asset.symbol);
          const swapData = await getSwapTransaction(
            usdc.address, targetToken.address, usdcAmount.toString(), plan.wallet_address
          );

          swaps.push({ symbol: asset.symbol, toToken: targetToken.address, usdcAmount: usdcAmount.toString(), transaction: swapData });
        }

        if (swaps.length === 0) { skipped++; continue; }

        // Prepare every swap before charging so unsupported assets or quote errors
        // do not result in a charge without a corresponding purchase attempt.
        // --- 2. CHARGE THE USER'S CARD (STRIPE) ---
        if (plan.stripe_customer_id) {
          try {
            await stripe.paymentIntents.create({
              amount: Math.round(totalToCharge * 100), // in cents
              currency: 'eur',
              customer: plan.stripe_customer_id,
              description: `DCA Execution - ${plan.basket_id}`,
              confirm: true,
              off_session: true,
              metadata: { userId: plan.user_id, dcaPlanId: plan.dca_plan_id },
            });
            log('info', 'Stripe charge successful', { userId: plan.user_id, amount: totalToCharge });
          } catch (stripeError) {
            log('error', 'Stripe charge failed - skipping user', { userId: plan.user_id, error: stripeError.message });

            await pool.query(`UPDATE subscriptions SET status = 'past_due' WHERE user_id = $1`, [plan.user_id]);
            if (plan.push_token) {
              await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: plan.push_token,
                  title: 'Payment Failed',
                  body: 'Your DCA failed due to insufficient funds. Please update your card.',
                }),
              }).catch(() => {});
            }
            skipped++;
            continue;
          }
        }

        // --- 3. EXECUTE DCA ---
        const { executed, failed } = await executeSwapBatch(swaps, {
          userId: plan.user_id, executionId, walletAddress: plan.wallet_address,
        });

        // --- 4. AUTO-REBALANCING ---
        let rebalanceResult = null;
        if (plan.subscription_plan === 'pro' || plan.subscription_plan === 'premium') {
          try {
            const rebalanceSwaps = await calculateRebalanceSwaps(plan.wallet_address, basketAssets);
            if (rebalanceSwaps.length > 0) {
              const rebalanceTxData = [];
              for (const swap of rebalanceSwaps) {
                const fromToken = await resolveToken(swap.fromSymbol);
                const toToken = await resolveToken(swap.toSymbol);
                const rbAmountString = swap.amountUsd.toFixed(USDC_DECIMALS);
                const rbUsdcAmount = parseUnits(rbAmountString, USDC_DECIMALS);
                
                const swapData = await getSwapTransaction(
                  fromToken.address, toToken.address, rbUsdcAmount.toString(), plan.wallet_address
                );
                rebalanceTxData.push({ symbol: swap.toSymbol, toToken: toToken.address, usdcAmount: rbUsdcAmount.toString(), transaction: swapData });
              }
              const rebalanceExec = await executeSwapBatch(rebalanceTxData, {
                userId: plan.user_id, executionId: `${executionId}-rebalance`, walletAddress: plan.wallet_address,
              });
              rebalanceResult = { executed: rebalanceExec.executed.length, failed: rebalanceExec.failed.length, swaps: rebalanceSwaps };
              rebalanced++;
            }
          } catch (err) { log('warn', 'Rebalance failed', { error: err.message }); }
        }

        // --- 5. RECORD TRANSACTION ---
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(
            `INSERT INTO transactions (user_id, type, amount_usd, status, metadata) VALUES ($1, 'dca_buy', $2, $3, $4)`,
            [plan.user_id, grossAmount, failed.length === 0 ? 'completed' : 'partial', JSON.stringify({ executionId, grossAmount, depositFee, netAmountInvested: netAmountToInvest, executed, failed, rebalance: rebalanceResult })]
          );
          if (executed.length > 0) {
            await client.query(`UPDATE dca_plans SET last_executed_at = NOW() WHERE id = $1`, [plan.dca_plan_id]);
          }
          await client.query('COMMIT');
        } catch (dbError) {
          await client.query('ROLLBACK');
          throw dbError;
        } finally { client.release(); }

        // --- 6. PUSH NOTIFICATION ---
        if (plan.push_token && executed.length > 0) {
          sendPushNotification(plan, executed, failed, rebalanceResult).catch((error) => {
            log('warn', 'Purchase notification failed', {
              userId: plan.user_id,
              error: error.message,
            });
          });
        }
        processed++;
      } catch (planError) {
        log('error', 'Plan execution failed', { userId: plan.user_id, error: planError.message });
        errors.push({ userId: plan.user_id, error: planError.message });
      }
    }

    return res.status(200).json({ ok: true, executionId, processed, skipped, rebalanced, total: plans.length, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
    log('error', 'DCA cron fatal error', { error: error.message });
    return res.status(500).json({ ok: false, error: error.message });
  } finally {
    await releaseLock(DCA_LOCK_ID).catch(() => {});
  }
}

async function sendPushNotification(plan, executed, failed, rebalance) {
  const assets = [...new Set(executed.map((purchase) => purchase.symbol))].join(', ');
  let body = failed.length === 0
    ? `Your recurring crypto purchase completed: ${assets}.`
    : `Your recurring crypto purchase was partially completed. Purchased: ${assets}.`;
  if (rebalance && rebalance.executed > 0) {
    body += ' Some portfolio positions were rebalanced.';
  }
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: plan.push_token,
      sound: 'default',
      title: failed.length === 0 ? 'Crypto purchase completed' : 'Crypto purchase partially completed',
      body,
      data: { screen: 'activity' },
    }),
  });
  if (!response.ok) throw new Error(`Push provider returned HTTP ${response.status}.`);
}
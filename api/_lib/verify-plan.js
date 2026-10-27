// api/lib/verify-plan.js
import pool from './db.js';

/**
 * Checks if a user has a valid, active subscription.
 * @param {string} privyUserId - The Privy User ID from the request header
 * @returns {Promise<{allowed: boolean, plan?: string, reason?: string}>}
 */
export async function verifyPlan(privyUserId) {
  if (!privyUserId) return { allowed: false, reason: 'No user ID' };

  try {
    const result = await pool.query(
      `SELECT s.plan, s.status, s.current_period_end 
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE u.privy_user_id = $1
       ORDER BY s.created_at DESC LIMIT 1`,
      [privyUserId]
    );

    if (result.rows.length === 0) {
      return { allowed: false, reason: 'No subscription found' };
    }

    const sub = result.rows[0];

    // Check if subscription is active and not expired
    if (sub.status !== 'active') {
      return { allowed: false, reason: `Subscription ${sub.status}` };
    }
    if (new Date(sub.current_period_end) < new Date()) {
      return { allowed: false, reason: 'Subscription expired' };
    }

    return { allowed: true, plan: sub.plan };
  } catch (error) {
    console.error('Plan verification error:', error);
    return { allowed: false, reason: 'Server error' };
  }
}
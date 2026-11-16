// api/auth.js
import { pool } from './_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { pathname } = new URL(req.url, `https://${req.headers.host}`);
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  
  const { email, password, privyUserId, walletAddress, name, avatarUrl } = body || {};

  try {
    // -----------------------------------------------------
    // ROUTE: Check if user exists
    // -----------------------------------------------------
    if (pathname === '/auth/check-user') {
      if (!email) return res.status(400).json({ message: 'Email is required' });
      const normalizedEmail = email.toLowerCase();

      const result = await pool.query(
        `SELECT 1 FROM user_credentials WHERE email = $1 LIMIT 1`,
        [normalizedEmail]
      );

      return res.status(200).json({ exists: result.rows.length > 0 });
    }

    // -----------------------------------------------------
    // ROUTE: Sync User (with New User Detection)
    // -----------------------------------------------------
    if (pathname === '/auth/sync-user') {
      if (!privyUserId) return res.status(400).json({ error: 'privyUserId is required' });
      
      const result = await pool.query(
        `INSERT INTO users (privy_user_id, email, wallet_address, name, avatar_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (privy_user_id)
         DO UPDATE SET 
            email = COALESCE(EXCLUDED.email, users.email), 
            wallet_address = COALESCE(EXCLUDED.wallet_address, users.wallet_address),
            name = COALESCE(EXCLUDED.name, users.name),
            avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
         RETURNING *, (xmax = 0) AS is_new_user`,
        [privyUserId, email || null, walletAddress || null, name || null, avatarUrl || null]
      );
      
      const userRow = result.rows[0];
      const isNewUser = userRow.is_new_user;
      
      // Remove the postgres-specific flag from the user object before sending
      delete userRow.is_new_user; 

      return res.status(200).json({ user: userRow, isNewUser });
    }

    // -----------------------------------------------------
    // ROUTE: Sync Wallet Address (Race Condition Fix)
    // -----------------------------------------------------
    if (pathname === '/auth/sync-wallet') {
      if (!privyUserId || !walletAddress) {
        return res.status(400).json({ error: 'privyUserId and walletAddress are required' });
      }

      // 1. Save the wallet address
      const userRes = await pool.query(
        `UPDATE users SET wallet_address = $1 WHERE privy_user_id = $2 RETURNING id`,
        [walletAddress, privyUserId]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userId = userRes.rows[0].id;

      // 2. Check if there's a pending subscription waiting for this wallet
      const { rows: pendingSubs } = await pool.query(
        `SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'pending_wallet'`,
        [userId]
      );

      if (pendingSubs.length > 0) {
        // 3. Activate the subscription
        await pool.query(
          `UPDATE subscriptions SET status = 'active', updated_at = NOW() WHERE user_id = $1`,
          [userId]
        );

        // 4. Create the DCA plan that was deferred
        // Note: The DCA plan details (basket, amount, frequency) need to come from the client
        // since they weren't saved in the pending state. The client should send them.
        const { basketId, amount, frequency } = body;
        
        if (basketId && amount && frequency) {
          await pool.query(
            `INSERT INTO dca_plans (user_id, basket_id, amount_usd, frequency, status, next_execution_date)
             VALUES ($1, $2, $3, $4, 'active', NOW())
             ON CONFLICT DO NOTHING`,
            [userId, basketId, Number(amount), frequency]
          );
        }

        return res.status(200).json({ ok: true, activated: true, userId });
      }

      return res.status(200).json({ ok: true, activated: false, userId });
    }

    // -----------------------------------------------------
    // ROUTE: Register Password
    // -----------------------------------------------------
    if (pathname === '/auth/register-password') {
      if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
      const normalizedEmail = email.toLowerCase();

      await pool.query(
        `INSERT INTO user_credentials (email, password_hash)
         VALUES ($1, crypt($2, gen_salt('bf', 10)))
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [normalizedEmail, password]
      );
      return res.status(200).json({ ok: true });
    }

    // -----------------------------------------------------
    // ROUTE: Verify Password
    // -----------------------------------------------------
    if (pathname === '/auth/verify-password') {
      if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
      const normalizedEmail = email.toLowerCase();

      const result = await pool.query(
        `SELECT password_hash = crypt($1, password_hash) AS ok
         FROM user_credentials
         WHERE email = $2`,
        [password, normalizedEmail]
      );

      if (result.rows.length === 0 || result.rows[0].ok !== true) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      return res.status(200).json({ ok: true });
    }

    // -----------------------------------------------------
    // ROUTE: Sign Out
    // -----------------------------------------------------
    if (pathname === '/auth/signout') {
      if (!privyUserId) return res.status(400).json({ error: 'privyUserId is required' });

      await pool.query(
        `UPDATE users SET push_token = NULL WHERE privy_user_id = $1`,
        [privyUserId]
      );
      return res.status(200).json({ ok: true, message: 'Signed out and token cleared' });
    }

    return res.status(404).json({ message: 'Not found' });
  } catch (err) {
    console.error('AUTH API ERROR:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
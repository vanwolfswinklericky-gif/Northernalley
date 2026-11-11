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
  
  // Added name, avatarUrl, and pushToken. Removed phone.
  const { email, password, privyUserId, walletAddress, name, avatarUrl, pushToken } = body || {};

  try {
    // -----------------------------------------------------
    // ROUTE: Sync User
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
         RETURNING *`,
        [privyUserId, email || null, walletAddress || null, name || null, avatarUrl || null]
      );
      return res.status(200).json({ user: result.rows[0] });
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
    // ROUTE: Sign Out (Clear Push Token)
    // -----------------------------------------------------
    if (pathname === '/auth/signout') {
      if (!privyUserId) return res.status(400).json({ error: 'privyUserId is required' });

      // Clear the push token so they stop getting notifications on this device
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
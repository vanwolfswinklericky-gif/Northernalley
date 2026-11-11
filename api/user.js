// api/user.js
import { put } from '@vercel/blob';
import { pool } from './_lib/db.js';

// Disable body parsing so we can handle multipart/form-data for uploads
export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { pathname } = new URL(req.url, `https://${req.headers.host}`);

  // ==========================================
  // 1. HANDLE AVATAR UPLOAD (/api/upload-avatar)
  // ==========================================
  if (pathname.includes('upload-avatar')) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
      const filename = `avatar-${Date.now()}.jpg`;
      const blob = await put(filename, req, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return res.status(200).json({ url: blob.url });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // 2. HANDLE DELETE ACCOUNT (/api/delete-user)
  // ==========================================
  if (pathname.includes('delete-user')) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = '';
    for await (const chunk of req) { body += chunk; }
    let data = {};
    try { data = JSON.parse(body || '{}'); } catch (e) {}

    const { privyUserId } = data;

    if (!privyUserId) return res.status(400).json({ error: 'privyUserId is required' });

    try {
      // 1. Delete the user from the main users table
      await pool.query('DELETE FROM users WHERE privy_user_id = $1', [privyUserId]);
      
      // 2. Delete from user_credentials table (using the email associated with the privyUserId)
      // Note: We do this in one query using a subquery to safely find their email first
      await pool.query(
        `DELETE FROM user_credentials 
         WHERE email = (SELECT email FROM users WHERE privy_user_id = $1)`,
        [privyUserId]
      );

      return res.status(200).json({ ok: true, message: 'User account deleted' });
    } catch (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ==========================================
  // 3. HANDLE USER SYNC (/api/user)
  // ==========================================
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let data = req.query;
  if (req.method === 'POST') {
    let body = '';
    for await (const chunk of req) { body += chunk; }
    try {
      data = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  // Removed 'phone' from destructuring
  const { privyUserId, email, walletAddress, name, avatarUrl } = data || {};

  if (!privyUserId) {
    return res.status(400).json({ error: 'privyUserId is required' });
  }

  try {
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
      [
        privyUserId, 
        email ?? null, 
        walletAddress ?? null, 
        name ?? null, 
        avatarUrl ?? null
      ]
    );

    return res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: err.message });
  }
}
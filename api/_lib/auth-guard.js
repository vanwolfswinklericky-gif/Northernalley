// api/_lib/auth-guard.js

import { PrivyClient } from '@privy-io/server-auth';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

/**
 * Verifies the Privy Authorization token from the request headers.
 * Returns the verified DID (privyUserId), or throws an error.
 */
export async function verifyPrivyUser(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const claims = await privy.verifyAuthToken(token);
    return claims.userId; // This is the real, verified DID
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Helper to sanitize the user object before sending to frontend.
 * Trims sensitive data.
 */
export function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url || user.avatarUrl,
    wallet_address: user.wallet_address,
    created_at: user.created_at,
  };
}
// api/cron/rebalance-index.js

import pool from '../_lib/db.js';

const USDC_DECIMALS = 6;

// In production, replace this with a real CoinMarketCap API call
async function fetchTop20FromCMC() {
  const res = await fetch(
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=20',
    {
      headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY },
    }
  );
  const data = await res.json();
  return data.data.map((c) => ({
    symbol: c.symbol,
    marketCap: c.quote.USD.market_cap,
  }));
}

export default async function handler(req, res) {
  // Security: require CRON_SECRET header
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch new top 20
    const newTop20 = await fetchTop20FromCMC();
    const totalMarketCap = newTop20.reduce((sum, c) => sum + c.marketCap, 0);

    const newCoinsJSON = newTop20.map((c) => ({
      symbol: c.symbol,
      weight: Number((c.marketCap / totalMarketCap).toFixed(4)),
    }));

    // 2. Update the master basket definition
    const { rows: basketRows } = await pool.query(
      `UPDATE baskets 
       SET coins = $1, updated_at = NOW() 
       WHERE slug = 'top20' AND type = 'prebuilt'
       RETURNING id`,
      [JSON.stringify(newCoinsJSON)]
    );

    if (basketRows.length === 0) {
      return res.status(404).json({ error: 'Top 20 basket not found' });
    }

    const basketId = basketRows[0].id;

    // 3. Get all users with an active DCA on this basket
    const { rows: users } = await pool.query(
      `SELECT d.user_id, u.wallet_address, u.push_token
       FROM dca_plans d
       JOIN users u ON u.id = d.user_id
       WHERE d.basket_id = $1 AND d.status = 'active'`,
      [basketId]
    );

    let processed = 0;
    const errors = [];

    // 4. Rebalance each user's wallet (placeholder — you need fetchWalletBalances)
    for (const user of users) {
      try {
        // TODO: Fetch current wallet balances here
        // Then build swaps to sell old coins and buy new ones
        processed++;
      } catch (err) {
        errors.push({ userId: user.user_id, error: err.message });
      }
    }

    // 5. Send push notification to all users
    for (const user of users) {
      if (user.push_token) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.push_token,
            sound: 'default',
            title: 'Top 20 Updated',
            body: 'Your Top 20 basket has been updated with the latest market leaders.',
          }),
        }).catch(() => {});
      }
    }

    return res.status(200).json({
      ok: true,
      newBasket: newCoinsJSON,
      usersProcessed: processed,
      errors,
    });
  } catch (error) {
    console.error('Index rebalance error:', error);
    return res.status(500).json({ error: error.message });
  }
}
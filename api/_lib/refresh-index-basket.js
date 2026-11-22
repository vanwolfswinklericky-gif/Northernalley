import pool from './db.js';

async function fetchTop20FromCMC() {
  const res = await fetch(
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=20',
    {
      headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY },
    }
  );
  const data = await res.json();
  return data.data.map((coin) => ({
    symbol: coin.symbol,
  }));
}

export async function refreshIndexBasket() {
  const newTop20 = await fetchTop20FromCMC();
  if (newTop20.length !== 20) {
    throw new Error(`Expected 20 assets from CoinMarketCap, received ${newTop20.length}.`);
  }
  const newCoinsJSON = newTop20.map((coin) => ({
    symbol: coin.symbol,
    weight: 0.05,
  }));

  const { rows: basketRows } = await pool.query(
    `UPDATE baskets
     SET coins = $1, updated_at = NOW()
     WHERE slug = 'top20' AND type = 'prebuilt'
     RETURNING id`,
    [JSON.stringify(newCoinsJSON)]
  );

  if (basketRows.length === 0) {
    throw new Error('Top 20 basket not found');
  }

  const basketId = basketRows[0].id;
  const { rows: users } = await pool.query(
    `SELECT d.user_id, u.wallet_address, u.push_token
     FROM dca_plans d
     JOIN users u ON u.id = d.user_id
     WHERE d.basket_id = $1 AND d.status = 'active'`,
    [basketId]
  );

  for (const user of users) {
    if (user.push_token) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.push_token,
          sound: 'default',
          title: 'Top 20 basket refreshed',
          body: 'The basket list now reflects the latest market leaders. Existing wallet holdings were not rebalanced.',
        }),
      }).catch(() => {});
    }
  }

  return {
    ok: true,
    newBasket: newCoinsJSON,
    usersProcessed: users.length,
    errors: [],
  };
}

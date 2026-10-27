// api/balances.js
import pool from './_lib/db.js';

const COIN_IDS = {
  ETH: 'ethereum',
  USDC: 'usd-coin',
  BTC: 'bitcoin',
  SOL: 'solana',
  BNB: 'binancecoin',
};

// ERC-20 token addresses on Base mainnet
const BASE_TOKENS = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  // Add more as needed
};

async function getEthBalance(address) {
  const apiKey = process.env.ALCHEMY_API_KEY;
  const url = `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest'],
    }),
  });
  const data = await response.json();
  const wei = BigInt(data.result || '0');
  return Number(wei) / 1e18;
}

async function getTokenBalance(address, tokenAddress) {
  const apiKey = process.env.ALCHEMY_API_KEY;
  const url = `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;
  // balanceOf(address) selector = 0x70a08231
  const data = '0x70a08231' + address.slice(2).padStart(64, '0');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: tokenAddress, data }, 'latest'],
    }),
  });
  const result = await response.json();
  const raw = BigInt(result.result || '0');
  return Number(raw) / 1e6; // USDC has 6 decimals
}

async function getPrices(symbols) {
  const ids = symbols.map((s) => COIN_IDS[s]).filter(Boolean).join(',');
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  );
  const data = await res.json();
  const out = {};
  for (const [symbol, id] of Object.entries(COIN_IDS)) {
    if (data[id]) {
      out[symbol] = { usd: data[id].usd, change24h: data[id].usd_24h_change ?? 0 };
    }
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const { privyUserId } = req.query;
  if (!privyUserId) return res.status(400).json({ error: 'privyUserId required' });

  try {
    const userResult = await pool.query(
      'SELECT wallet_address FROM users WHERE privy_user_id = $1',
      [privyUserId]
    );
    if (userResult.rows.length === 0 || !userResult.rows[0].wallet_address) {
      return res.status(200).json({ holdings: [], totalValue: 0 });
    }

    const address = userResult.rows[0].wallet_address;

    // Fetch balances in parallel
    const [ethBalance, usdcBalance] = await Promise.all([
      getEthBalance(address).catch(() => 0),
      getTokenBalance(address, BASE_TOKENS.USDC).catch(() => 0),
    ]);

    const holdings = [];
    if (ethBalance > 0) holdings.push({ symbol: 'ETH', amount: ethBalance });
    if (usdcBalance > 0) holdings.push({ symbol: 'USDC', amount: usdcBalance });

    // Fetch prices
    const symbols = holdings.map((h) => h.symbol);
    const prices = symbols.length > 0 ? await getPrices(symbols) : {};

    // Combine into a single response
    const enriched = holdings.map((h) => {
      const p = prices[h.symbol] || { usd: 0, change24h: 0 };
      return {
        symbol: h.symbol,
        amount: h.amount,
        usdPrice: p.usd,
        usdValue: h.amount * p.usd,
        change24h: p.change24h,
      };
    });

    const totalValue = enriched.reduce((sum, h) => sum + h.usdValue, 0);

    return res.status(200).json({ holdings: enriched, totalValue });
  } catch (err) {
    console.error('Balances error:', err);
    return res.status(500).json({ error: err.message });
  }
}
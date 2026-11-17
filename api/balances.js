import { pool } from './_lib/db.js';
import { resolveToken } from './_lib/swap.js';

const COIN_IDS = {
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  BCH: 'bitcoin-cash',
  BNB: 'binancecoin',
  BTC: 'bitcoin',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  ETH: 'ethereum',
  HBAR: 'hedera-hashgraph',
  JUP: 'jupiter-exchange-solana',
  LINK: 'chainlink',
  LTC: 'litecoin',
  MIN: 'minswap',
  RAY: 'raydium',
  SHIB: 'shiba-inu',
  SOL: 'solana',
  SUI: 'sui',
  TON: 'the-open-network',
  TRX: 'tron',
  USDC: 'usd-coin',
  USDT: 'tether',
  XLM: 'stellar',
  XRP: 'ripple',
};

const BASE_USDC = {
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  decimals: 6,
};

function parseJson(value) {
  if (typeof value !== 'string') return value;
  return JSON.parse(value);
}

function addSymbolsFromMetadata(symbols, rawMetadata) {
  try {
    const metadata = parseJson(rawMetadata);
    if (!metadata || !Array.isArray(metadata.executed)) return;
    for (const transaction of metadata.executed) {
      if (typeof transaction?.symbol === 'string') {
        symbols.add(transaction.symbol.toUpperCase());
      }
    }
  } catch (error) {
    console.warn('Could not parse transaction metadata for wallet assets:', error);
  }
}

async function getRpcResult(method, params) {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) throw new Error('ALCHEMY_API_KEY is not configured.');

  const response = await fetch(`https://base-mainnet.g.alchemy.com/v2/${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`Base RPC request failed (HTTP ${response.status}).`);

  const result = await response.json();
  if (result.error) {
    throw new Error(`Base RPC ${method} failed: ${result.error.message ?? 'unknown error'}`);
  }
  return result.result;
}

async function getEthBalance(address) {
  const result = await getRpcResult('eth_getBalance', [address, 'latest']);
  return Number(BigInt(result)) / 1e18;
}

async function getTokenBalance(address, tokenAddress, decimals) {
  const data = `0x70a08231${address.slice(2).padStart(64, '0')}`;
  const result = await getRpcResult('eth_call', [{ to: tokenAddress, data }, 'latest']);
  return Number(BigInt(result || '0')) / (10 ** decimals);
}

async function getPrices(symbols) {
  const coinIds = [...new Set(symbols.map((symbol) => COIN_IDS[symbol]).filter(Boolean))];
  if (coinIds.length === 0) return {};

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
  );
  if (!response.ok) throw new Error(`Price lookup failed (HTTP ${response.status}).`);

  const data = await response.json();
  const prices = {};
  for (const [symbol, coinId] of Object.entries(COIN_IDS)) {
    if (data[coinId]?.usd != null) {
      prices[symbol] = {
        usd: data[coinId].usd,
        change24h: data[coinId].usd_24h_change ?? 0,
      };
    }
  }
  return prices;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const { privyUserId } = req.query;
  if (!privyUserId) return res.status(400).json({ error: 'privyUserId required' });

  try {
    const userResult = await pool.query(
      'SELECT id, wallet_address FROM users WHERE privy_user_id = $1',
      [privyUserId]
    );
    if (userResult.rows.length === 0 || !userResult.rows[0].wallet_address) {
      return res.status(200).json({ holdings: [], totalValue: 0 });
    }

    const { id: userId, wallet_address: address } = userResult.rows[0];
    const symbols = new Set(['ETH', 'USDC']);

    const [basketResult, transactionResult] = await Promise.all([
      pool.query(
        `SELECT b.coins
         FROM dca_plans d
         JOIN baskets b ON b.id = d.basket_id
         WHERE d.user_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT metadata
         FROM transactions
         WHERE user_id = $1 AND type IN ('dca_buy', 'instant_buy')
         ORDER BY created_at DESC`,
        [userId]
      ),
    ]);

    for (const row of basketResult.rows) {
      try {
        const coins = parseJson(row.coins);
        if (!Array.isArray(coins)) continue;
        for (const coin of coins) {
          if (typeof coin?.symbol === 'string') symbols.add(coin.symbol.toUpperCase());
        }
      } catch (error) {
        console.warn('Could not parse basket assets for wallet balances:', error);
      }
    }
    for (const row of transactionResult.rows) {
      addSymbolsFromMetadata(symbols, row.metadata);
    }

    const balanceResults = await Promise.all(
      [...symbols].map(async (symbol) => {
        if (symbol === 'ETH') {
          return { symbol, amount: await getEthBalance(address) };
        }
        let token = BASE_USDC;
        if (symbol !== 'USDC') {
          try {
            token = await resolveToken(symbol);
          } catch (error) {
            if (error.message?.startsWith('Token not found on Base:')) {
              return { symbol, unsupported: true };
            }
            throw error;
          }
        }
        return {
          symbol,
          amount: await getTokenBalance(address, token.address, token.decimals),
        };
      })
    );

    const unsupportedAssets = balanceResults
      .filter((result) => result.unsupported)
      .map((result) => result.symbol);
    const holdings = balanceResults
      .filter((holding) => !holding.unsupported && holding.amount > 0)
      .map((holding) => ({ ...holding, usdPrice: null, usdValue: null, change24h: null }));

    let prices = {};
    let pricingAvailable = true;
    try {
      prices = await getPrices(holdings.map((holding) => holding.symbol));
    } catch (error) {
      pricingAvailable = false;
      console.warn('Wallet balances loaded without prices:', error);
    }

    for (const holding of holdings) {
      const price = prices[holding.symbol];
      if (!price) {
        pricingAvailable = false;
        continue;
      }
      holding.usdPrice = price.usd;
      holding.usdValue = holding.amount * price.usd;
      holding.change24h = price.change24h;
    }

    const totalValue = holdings.reduce((sum, holding) => sum + (holding.usdValue ?? 0), 0);
    return res.status(200).json({ holdings, totalValue, pricingAvailable, unsupportedAssets });
  } catch (error) {
    console.error('Balances error:', error);
    return res.status(500).json({ error: error.message });
  }
}

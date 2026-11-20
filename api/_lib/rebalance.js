// api/_lib/rebalance.js

import { resolveToken } from './swap.js';

const REBALANCE_THRESHOLD = 0.05; // 5% drift allowed before rebalancing
const MIN_REBALANCE_USD = 10;     // Don't rebalance if swap is less than $10 (gas fees)

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const COIN_IDS = {
  AVAX: 'avalanche-2',
  BNB: 'binancecoin',
  BTC: 'bitcoin',
  ETH: 'ethereum',
  LINK: 'chainlink',
  SOL: 'solana',
  USDC: 'usd-coin',
  XRP: 'ripple',
};

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
  if (result.error) throw new Error(result.error.message ?? `Base RPC ${method} failed.`);
  return result.result;
}

async function getTokenBalance(walletAddress, tokenAddress, decimals) {
  const data = `0x70a08231${walletAddress.slice(2).padStart(64, '0')}`;
  const result = await getRpcResult('eth_call', [{ to: tokenAddress, data }, 'latest']);
  return Number(BigInt(result || '0')) / (10 ** decimals);
}

async function fetchWalletBalances(walletAddress) {
  const balances = {};

  // ERC-20 holdings can be safely measured and rebalanced with this implementation.
  // Native ETH is intentionally excluded because it requires wrapping before an ERC-20 swap.
  const usdcBalance = await getTokenBalance(walletAddress, USDC_ADDRESS, 6);
  if (usdcBalance > 0) balances.USDC = usdcBalance;

  const basketSymbols = new Set(['AVAX', 'BNB', 'BTC', 'LINK', 'SOL', 'XRP']);
  for (const symbol of basketSymbols) {
    try {
      const token = await resolveToken(symbol);
      if (!token?.address || symbol === 'ETH') continue;
      const balance = await getTokenBalance(walletAddress, token.address, token.decimals);
      if (balance > 0) balances[symbol] = balance;
    } catch (error) {
      if (!error.message?.startsWith('Token not found on Base:')) throw error;
    }
  }

  return balances;
}

async function fetchUsdPrices(symbols) {
  const coinIds = [...new Set(symbols.map((symbol) => COIN_IDS[symbol]).filter(Boolean))];
  if (coinIds.length === 0) return {};

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`
  );
  if (!response.ok) throw new Error(`Price lookup failed (HTTP ${response.status}).`);

  const data = await response.json();
  const prices = {};
  for (const [symbol, coinId] of Object.entries(COIN_IDS)) {
    if (data[coinId]?.usd != null) prices[symbol] = data[coinId].usd;
  }
  return prices;
}

/**
 * Main rebalance function.
 * @param {string} walletAddress - The user's wallet address.
 * @param {Array} basketAssets - The target basket weights (e.g., [{ symbol: 'ETH', weight: 0.5 }]).
 * @returns {Array} Array of swaps needed to rebalance.
 */
export async function calculateRebalanceSwaps(walletAddress, basketAssets) {
  // 1. Fetch live balances
  const balances = await fetchWalletBalances(walletAddress);

  // 2. If the wallet is empty or provider failed, skip rebalancing
  if (!balances || Object.keys(balances).length === 0) {
    return [];
  }
  const supportedAssets = basketAssets.filter((asset) => asset.symbol !== 'ETH');
  const prices = await fetchUsdPrices([
    ...supportedAssets.map((asset) => asset.symbol),
    ...Object.keys(balances),
  ]);

  // 3. Calculate total portfolio value (in USDC terms)
  let totalPortfolioValue = 0;
  const currentHoldings = [];

  for (const asset of supportedAssets) {
    const balance = balances[asset.symbol] || 0;
    
    if (balance > 0) {
      const price = prices[asset.symbol] || 0;
      if (price <= 0) continue;
      const value = balance * price;
      
      totalPortfolioValue += value;
      currentHoldings.push({
        symbol: asset.symbol,
        balance,
        value,
        targetWeight: asset.weight,
        currentWeight: 0, // Will calculate below
      });
    }
  }

  // 4. If portfolio value is too small (e.g., < $50), skip rebalancing
  if (totalPortfolioValue < 50) {
    return [];
  }

  // 5. Calculate current weights and drift
  const driftReport = currentHoldings.map((holding) => {
    const currentWeight = holding.value / totalPortfolioValue;
    const drift = currentWeight - holding.targetWeight;
    return {
      ...holding,
      currentWeight,
      drift,
    };
  });

  // 6. Separate over-allocated (sell) and under-allocated (buy) assets
  const overAllocated = driftReport
    .filter((h) => h.drift > REBALANCE_THRESHOLD)
    .sort((a, b) => b.drift - a.drift); // Sell the most over-allocated first

  const underAllocated = driftReport
    .filter((h) => h.drift < -REBALANCE_THRESHOLD)
    .sort((a, b) => a.drift - b.drift); // Buy the most under-allocated first

  // 7. Generate swaps
  const swaps = [];

  for (const sell of overAllocated) {
    // How much value needs to be sold to hit the target weight
    let valueToSell = sell.value - (totalPortfolioValue * sell.targetWeight);

    for (const buy of underAllocated) {
      if (valueToSell < MIN_REBALANCE_USD) break;

      // How much value needs to be bought to hit the target weight
      const valueToBuy = (totalPortfolioValue * buy.targetWeight) - buy.value;

      // Swap the smaller of the two amounts
      const swapValue = Math.min(valueToSell, valueToBuy);

      if (swapValue >= MIN_REBALANCE_USD) {
        swaps.push({
          fromSymbol: sell.symbol,
          toSymbol: buy.symbol,
          amountUsd: swapValue,
        });
        
        // Update remaining values
        valueToSell -= swapValue;
        buy.value += swapValue; // The buy asset is now closer to its target
      }
    }
  }

  return swaps;
}
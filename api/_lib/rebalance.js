// api/_lib/rebalance.js

import { resolveToken } from './swap.js';

const REBALANCE_THRESHOLD = 0.05; // 5% drift allowed before rebalancing
const MIN_REBALANCE_USD = 10;     // Don't rebalance if swap is less than $10 (gas fees)

// Placeholder for fetching on-chain balances.
// In production, replace this with a call to your wallet provider (e.g., Alchemy, Moralis, or Privy API).
async function fetchWalletBalances(walletAddress) {
  // Example real implementation using Alchemy (you would need to add ALchemy SDK):
  // const alchemy = new Alchemy({ apiKey: process.env.ALCHEMY_API_KEY, network: Network.ETH_MAINNET });
  // const balances = await alchemy.core.getTokenBalances(walletAddress);
  // return balances.tokenBalances.map(b => ({ symbol: b.contractAddress, balance: parseInt(b.tokenBalance, 16) / 1e18 }));

  // For now, return an empty object so this function doesn't crash.
  // In dev, rebalancing won't trigger, but the code is ready for production.
  console.warn('[Rebalance] fetchWalletBalances is a placeholder. Implement Alchemy/Moralis here.');
  return {}; 
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

  // 3. Calculate total portfolio value (in USDC terms)
  let totalPortfolioValue = 0;
  const currentHoldings = [];

  for (const asset of basketAssets) {
    const balance = balances[asset.symbol] || 0;
    
    if (balance > 0) {
      // Resolve the token to get its current price
      const token = await resolveToken(asset.symbol);
      const price = token.usdPrice || 0; // Assuming resolveToken returns usdPrice
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
export function normalizeBasketWeights(slug, coins) {
  const parsed = typeof coins === 'string' ? JSON.parse(coins) : coins;
  if (slug !== 'top20') return normalizeEthUsdcWeights(parsed);

  if (!Array.isArray(parsed) || parsed.length !== 20) {
    throw new Error('Top 20 basket must contain exactly 20 assets.');
  }

  const symbols = parsed.map((asset) => asset?.symbol);
  if (symbols.some((symbol) => typeof symbol !== 'string' || !symbol) ||
      new Set(symbols).size !== 20) {
    throw new Error('Top 20 basket must contain 20 unique asset symbols.');
  }

  return parsed.map((asset) => ({ ...asset, weight: 0.05 }));
}

export function normalizeEthUsdcWeights(coins) {
  let assets = coins;
  if (typeof assets === 'string') {
    try {
      assets = JSON.parse(assets);
    } catch {
      return coins;
    }
  }

  if (!Array.isArray(assets) || assets.length !== 2) return coins;

  const symbols = assets.map((asset) => asset?.symbol);
  if (!symbols.includes('ETH') || !symbols.includes('USDC')) return coins;

  const normalized = assets.map((asset) => ({ ...asset, weight: 0.5 }));
  return typeof coins === 'string' ? JSON.stringify(normalized) : normalized;
}

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

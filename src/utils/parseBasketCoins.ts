import type { BasketCoin } from '@/types/basket';

export function parseBasketCoins(value: unknown): BasketCoin[] {
  let coins = value;

  if (typeof coins === 'string') {
    try {
      coins = JSON.parse(coins);
    } catch (error) {
      console.error('Failed to parse basket coins:', error);
      return [];
    }
  }

  if (!Array.isArray(coins)) {
    console.error('Basket coins must be an array.');
    return [];
  }

  return coins.flatMap((coin): BasketCoin[] => {
    if (typeof coin === 'string' && coin.length > 0) {
      return [{ symbol: coin, weight: 0 }];
    }

    if (
      typeof coin === 'object' &&
      coin !== null &&
      'symbol' in coin &&
      typeof coin.symbol === 'string' &&
      coin.symbol.length > 0
    ) {
      const weight =
        'weight' in coin && typeof coin.weight === 'number' && Number.isFinite(coin.weight)
          ? coin.weight
          : 0;
      return [{ symbol: coin.symbol, weight }];
    }

    console.error('Ignoring invalid coin in basket data:', coin);
    return [];
  });
}

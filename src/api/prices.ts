// src/api/prices.ts

const BASE_URL = 'https://api.coingecko.com/api/v3';

const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
};

export interface PriceData {
  [symbol: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export async function getPrices(symbols: string[]): Promise<PriceData> {
  const ids = symbols.map((s) => COIN_IDS[s]).filter(Boolean).join(',');
  if (!ids) return {};

  const response = await fetch(
    `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  );

  if (!response.ok) {
    throw new Error(`CoinGecko error: ${response.status}`);
  }

  const data = await response.json();
  const result: PriceData = {};
  
  for (const [symbol, geckoId] of Object.entries(COIN_IDS)) {
    if (data[geckoId]) {
      result[symbol] = {
        usd: data[geckoId].usd,
        usd_24h_change: data[geckoId].usd_24h_change ?? 0,
      };
    }
  }
  return result;
}
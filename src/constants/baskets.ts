// src/constants/baskets.ts

export interface Basket {
  id: string;
  name: string;
  description: string;
  assets: number;
  risk: 'Conservative' | 'Balanced' | 'Growth';
  coins: string[];
}

export const BASKETS: Basket[] = [
  {
    id: 'top20',
    name: 'Top 20 Crypto',
    description: 'The 20 largest assets by market cap, rebalanced monthly.',
    assets: 20,
    risk: 'Balanced',
    coins: ['BTC', 'ETH', 'SOL'],
  },
  {
    id: 'btceth',
    name: 'Bitcoin + Ethereum',
    description: 'The two foundational networks, weighted 60 / 40.',
    assets: 2,
    risk: 'Conservative',
    coins: ['BTC', 'ETH'],
  },
  {
    id: 'sol',
    name: 'Solana Ecosystem',
    description: 'SOL plus leading tokens building on Solana.',
    assets: 8,
    risk: 'Growth',
    coins: ['SOL', 'JUP', 'RAY'],
  },
  {
    id: 'ada',
    name: 'Cardano Ecosystem',
    description: 'ADA and projects across the Cardano network.',
    assets: 6,
    risk: 'Growth',
    coins: ['ADA', 'MIN', 'DOT'],
  },
];

export const AMOUNTS = [50, 100, 250, 500];
export const FEE_RATE = 0.015;

export const basketById = (id: string | null) =>
  BASKETS.find((b) => b.id === id) || BASKETS[0];

export const fmtUSD = (n: number, d = 2) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
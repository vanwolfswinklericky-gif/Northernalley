export interface BasketCoin {
  symbol: string;
  weight: number;
}

export interface Basket {
  id: string;
  slug?: string;
  name: string;
  description: string;
  type: 'prebuilt' | 'custom';
  coins: BasketCoin[];
}

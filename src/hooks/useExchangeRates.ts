// src/hooks/useExchangeRates.ts
import { CURRENCIES } from '@/constants/currencies';
import { useQuery } from '@tanstack/react-query';

interface RateResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

async function fetchRates(): Promise<Record<string, number>> {
  // Free, no API key required. Updates once daily.
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error('Failed to fetch exchange rates');
  
  const data: RateResponse = await res.json();
  if (data.result !== 'success') throw new Error('API returned error');
  
  return data.rates;
}

export function useExchangeRates() {
  const { data: liveRates, isLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: fetchRates,
    staleTime: 1000 * 60 * 60 * 12, // Cache for 12 hours (rates update daily)
  });

  // Fallback: If API fails, use the hardcoded rates from your constants
  const rates = liveRates || Object.fromEntries(
    CURRENCIES.map(c => [c.code, c.rateFromUSD])
  );

  return { rates, isLoading };
}
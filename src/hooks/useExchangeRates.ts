// src/hooks/useExchangeRates.ts
import { CURRENCIES } from '@/constants/currencies';
import { usePlanStore } from '@/store/planStore';
import { useQuery } from '@tanstack/react-query';

interface RateResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

async function fetchRates(): Promise<Record<string, number>> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error('Failed to fetch exchange rates');
  
  const data: RateResponse = await res.json();
  if (data.result !== 'success') throw new Error('API returned error');
  
  return data.rates;
}

export function useExchangeRates() {
  const currency = usePlanStore((s) => s.currency);

  const { data: liveRates, isLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: fetchRates,
    staleTime: 1000 * 60 * 60 * 12, // Cache for 12 hours
    retry: 2,
  });

  // 1. Fallback to hardcoded rates if API fails
  const rates = liveRates || Object.fromEntries(
    CURRENCIES.map(c => [c.code, c.rateFromUSD])
  );

  // 2. Production-grade formatting function (handles symbols, commas, decimals)
  const format = (amountInUSD: number) => {
    const rate = rates[currency] || 1;
    const converted = amountInUSD * rate;

    try {
      // Intl.NumberFormat automatically handles symbols (₦, $, €) and decimals
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
    } catch (e) {
      // Absolute fallback if invalid currency code is passed
      return `${currency} ${converted.toFixed(2)}`;
    }
  };

  return { rates, isLoading, format, currency };
}
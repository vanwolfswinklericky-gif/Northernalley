// src/utils/currency.ts
import { usePlanStore } from '@/store/planStore';

// You can expand this list or pull it from an API later
const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1500,
  CAD: 1.35,
};

export function useCurrency() {
  const currency = usePlanStore((s) => s.currency);
  
  const format = (amountInUSD: number) => {
    // 1. Get the exchange rate, defaulting to 1 if we don't have it yet
    const rate = RATES[currency] || 1;
    const converted = amountInUSD * rate;

    // 2. Use Intl.NumberFormat to automatically format ANY currency
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency, // e.g., 'USD', 'NGN', 'JPY'
      }).format(converted);
    } catch (error) {
      // Fallback just in case an invalid currency string is passed
      return `${currency} ${converted.toFixed(2)}`;
    }
  };

  return { format, currency };
}
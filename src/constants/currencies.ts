// src/constants/currencies.ts

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rateFromUSD: number; // Fallback rate if API fails
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rateFromUSD: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', rateFromUSD: 0.92 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rateFromUSD: 0.79 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rateFromUSD: 1400.0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rateFromUSD: 1.35 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateFromUSD: 1.52 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateFromUSD: 151.0 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateFromUSD: 83.0 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rateFromUSD: 0.90 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rateFromUSD: 7.23 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rateFromUSD: 5.0 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', rateFromUSD: 18.5 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rateFromUSD: 3.67 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', rateFromUSD: 10.5 },
];

export const getCurrency = (code: string) => 
  CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
// src/components/ui/CoinBadge.tsx

import { COLORS } from '@/constants/theme';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

// Map symbols to their TrustWallet contract addresses on Ethereum
// For production, you'd want to map these dynamically based on the chain
const TOKEN_ADDRESSES: Record<string, string> = {
  BTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC (Wrapped Bitcoin) since BTC isn't an ERC20
  ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // Binance-Peg Ethereum (or use native logo)
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  SOL: '0xd31a59c85ae9d8edefec411d448f90841571b89c', // Wrapped SOL
  BNB: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  XRP: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE',
  ADA: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47',
  AVAX: '0x1CE0c2827e2eF14D5C4f29a091d735A204794041',
  LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  DOT: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',
  MATIC: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
  DOGE: '0xba2ae424d960c26247dd6c32edc70b295c744c43',
  SHIB: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
  LTC: '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94',
  UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  ATOM: '0x0eb3a705fc54725037cc9e008bdede697f62f335',
  XLM: '0x43f5e21db1a9a52bc40170dcd0a3c5e3c5f8f4c6',
  NEAR: '0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4',
  APT: '0x1b9743f556d65e757c4c650b4555baf354cb8bd3',
  ARB: '0xb50721bcf8d664c1bf3b8f8f805f6c7e5e5a6e6c',
  OP: '0x4200000000000000000000000000000000000042',
  HYPE: '0x', // Not a standard ERC20, use a generic fallback
};

// These are native coins that don't have a contract address on Ethereum, 
// but TrustWallet hosts their logos in the 'info' folder
const NATIVE_LOGOS: Record<string, string> = {
  BTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  ETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  BNB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
  SOL: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
  XRP: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ripple/info/logo.png',
  ADA: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png',
  DOT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polkadot/info/logo.png',
  AVAX: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
  LINK: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
  MATIC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  DOGE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png',
  LTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/litecoin/info/logo.png',
};

interface CoinBadgeProps {
  symbol: string;
  size?: number;
  style?: any;
}

export function CoinBadge({ symbol, size = 40, style }: CoinBadgeProps) {
  const [imgError, setImgError] = useState(false);
  const upperSymbol = symbol.toUpperCase();
  
  // 1. Try to find a native logo first (BTC, ETH, etc.)
  let logoUrl = NATIVE_LOGOS[upperSymbol];

  // 2. If not a native coin, build the TrustWallet URL using the contract address
  if (!logoUrl && TOKEN_ADDRESSES[upperSymbol]) {
    logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${TOKEN_ADDRESSES[upperSymbol]}/logo.png`;
  }

  // 3. If we have a URL and no error, render the real logo
  if (logoUrl && !imgError) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={[
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
        onError={() => setImgError(true)}
      />
    );
  }

  // 4. Fallback: Render the colored text badge (Your original code)
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.accentSoft,
        },
        style,
      ]}
    >
      <Text style={{ color: COLORS.accentText, fontSize: size * 0.35, fontWeight: '700', letterSpacing: -0.5 }}>
        {upperSymbol.slice(0, 3)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});
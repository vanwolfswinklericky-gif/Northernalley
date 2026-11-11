// src/screens/app/WalletScreen.tsx

import { Button } from '@/components/ui/Button';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Container } from '@/components/ui/Container';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fmtPct, fmtUSD } from '@/constants/baskets';
import { COLORS } from '@/constants/theme';
import { useBalances } from '@/hooks/useBalances';
import { Ionicons } from '@expo/vector-icons';
import { useEmbeddedEthereumWallet } from '@privy-io/expo'; // <-- CHANGED IMPORT
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface WalletScreenProps {
  onBack: () => void;
  onAsset: (symbol: string) => void;
}

const qtyFmt = (q: number) => (q < 1 ? q.toFixed(4) : q.toFixed(2));

export function WalletScreen({ onBack, onAsset }: WalletScreenProps) {
  const { holdings } = useBalances();
  
  // CHANGED: Use the Ethereum Wallet hook to read directly from the wallets array
  const { wallets } = useEmbeddedEthereumWallet();
  const embeddedWallet = wallets?.find((w) => w.walletIndex === 0);
  const walletAddress = embeddedWallet?.address;

  const [copied, setCopied] = useState(false);
  const [receiving, setReceiving] = useState(false);

  const copy = async () => {
    if (!walletAddress) return;
    setReceiving(true);
    await Clipboard.setStringAsync(walletAddress);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setReceiving(false);
    }, 1600);
  };

  // Show loader if the address hasn't loaded yet
  if (!walletAddress) {
    return (
      <Screen onBack={onBack} title="Wallet">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={{ marginTop: 16, color: COLORS.t2 }}>Loading wallet...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      onBack={onBack}
      title="Wallet"
      subtitle="Your self-custody address on Ethereum."
    >
      <Container style={{ alignItems: 'center' }}>
        <View style={styles.qrWrap}>
          <QRCode
            value={walletAddress}
            size={180}
            color={COLORS.t1}
            backgroundColor="#fff"
          />
        </View>

        <View style={styles.addressRow}>
          <Text style={styles.address} numberOfLines={1}>
            {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
          </Text>
          <Pressable onPress={copy} style={[styles.copyBtn, { backgroundColor: COLORS.accent }]}>
            <Ionicons
              name={copied ? 'checkmark-outline' : 'copy-outline'}
              size={14}
              color="#fff"
            />
            <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
          </Pressable>
        </View>
      </Container>

      <View style={styles.actionsRow}>
        <View style={{ flex: 1 }}>
          <Button 
            label="Receive" 
            icon="arrow-down-outline" 
            onPress={copy} 
            loading={receiving} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Send"
            variant="secondary"
            icon="arrow-up-outline"
            onPress={() => {}}
          />
        </View>
      </View>

      <SectionHeader title="Balances" />

      <Container flush>
        {holdings.map((h, i) => {
          const isUp = h.change24h >= 0;
          return (
            <ListRow
              key={h.symbol}
              leading={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CoinBadge symbol={h.symbol} />
                  <View style={[
                    styles.trendBadge, 
                    { backgroundColor: isUp ? COLORS.upSoft : COLORS.downSoft }
                  ]}>
                    <Ionicons 
                      name={isUp ? 'trending-up' : 'trending-down'} 
                      size={14} 
                      color={isUp ? COLORS.up : COLORS.down} 
                    />
                  </View>
                </View>
              }
              title={h.symbol}
              subtitle={`${qtyFmt(h.amount)} ${h.symbol}`}
              value={fmtUSD(h.usdValue)}
              valueSub={fmtPct(h.change24h)}
              valueTone={isUp ? 'up' : 'down'}
              onPress={() => onAsset(h.symbol)}
              last={i === holdings.length - 1}
            />
          );
        })}
      </Container>

      {copied && (
        <View style={[styles.toast, { backgroundColor: COLORS.accent }]}>
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
          <Text style={styles.toastText}>Address copied</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrWrap: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
    marginBottom: 20,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  address: {
    flex: 1,
    fontFamily: 'Courier',
    fontSize: 14,
    color: COLORS.t1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 36,
  },
  copyText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  trendBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
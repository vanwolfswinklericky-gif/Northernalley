// src/screens/app/WalletScreen.tsx

import { Button } from '@/components/ui/Button';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Container } from '@/components/ui/Container';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fmtPct, fmtUSD } from '@/constants/baskets';
import { COLORS, RADIUS } from '@/constants/theme';
import { useBalances } from '@/hooks/useBalances';
import { Ionicons } from '@expo/vector-icons';
import { useEmbeddedEthereumWallet } from '@privy-io/expo';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface WalletScreenProps {
  onBack: () => void;
  onAsset: (symbol: string) => void;
}

const qtyFmt = (q: number) => (q < 1 ? q.toFixed(4) : q.toFixed(2));

export function WalletScreen({ onBack, onAsset }: WalletScreenProps) {
  const { holdings, unsupportedAssets } = useBalances();
  
  const { wallets } = useEmbeddedEthereumWallet();
  const embeddedWallet = wallets?.find((w) => w.walletIndex === 0);
  const walletAddress = embeddedWallet?.address;

  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const copy = async () => {
    if (!walletAddress) return;
    try {
      await Clipboard.setStringAsync(walletAddress);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Failed to copy wallet address:', error);
      Alert.alert('Unable to copy', 'Please try copying your wallet address again.');
    }
  };

  if (!walletAddress) {
    return (
      <Screen onBack={onBack} title="Wallet">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      onBack={onBack}
      title="Your Wallet"
      subtitle="Receive ETH or USDC on Base. Other networks or tokens may not appear in your app balance."
    >
      {/* QR & Address Card */}
      <Container style={styles.qrCard}>
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
          <Pressable onPress={copy} style={styles.copyBtn}>
            <Ionicons
              name={copied ? 'checkmark' : 'copy'}
              size={16}
              color="#fff"
            />
            <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
          </Pressable>
        </View>
        
        <Text style={styles.networkText}>Network: Base mainnet</Text>
      </Container>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <View style={{ flex: 1 }}>
          <Button 
            label="Copy address"
            icon="arrow-down-outline" 
            onPress={copy} 
            variant="accent"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Send"
            variant="secondary"
            icon="arrow-up-outline"
            disabled
            onPress={() => undefined}
          />
        </View>
      </View>

      {/* Balances List */}
      <SectionHeader title="Your Balances" />
      {unsupportedAssets.length > 0 && (
        <Text style={styles.networkText}>
          We couldn’t track these basket assets on Base: {unsupportedAssets.join(', ')}.
        </Text>
      )}

      <Container flush style={styles.balancesCard}>
        {holdings.map((h, i) => {
          const isUp = (h.change24h ?? 0) >= 0;
          return (
            <ListRow
              key={h.symbol}
              leading={<CoinBadge symbol={h.symbol} size={40} />}
              title={h.symbol}
              subtitle={`${qtyFmt(h.amount)} ${h.symbol}`}
              value={h.usdValue == null ? 'Price unavailable' : fmtUSD(h.usdValue)}
              valueSub={h.change24h == null ? undefined : fmtPct(h.change24h)}
              valueTone={h.change24h == null ? undefined : isUp ? 'up' : 'down'}
              onPress={() => onAsset(h.symbol)}
              last={i === holdings.length - 1}
            />
          );
        })}
      </Container>

      {/* Toast */}
      {copied && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
          <Text style={styles.toastText}>Address copied to clipboard</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 16, 
    color: COLORS.t2, 
    fontWeight: '500' 
  },
  qrCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  qrWrap: {
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.accentMedium,
    marginBottom: 24,
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
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.t1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 36,
    backgroundColor: COLORS.accent,
  },
  copyText: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: '700' 
  },
  networkText: {
    fontSize: 12,
    color: COLORS.t3,
    marginTop: 16,
    fontWeight: '500',
  },
  actionsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 8,
    marginBottom: 24,
  },
  balancesCard: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
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
    backgroundColor: COLORS.accent,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  toastText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
});
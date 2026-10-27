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
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface WalletScreenProps {
  onBack: () => void;
  onAsset: (symbol: string) => void;
}

const WALLET = '0x7F3a9C21bE04d8A5f6C19e2D0b84A3E7c5D19B42';

// Local quantity formatter (replaces qtyFmt from the deleted constants file)
const qtyFmt = (q: number) => (q < 1 ? q.toFixed(4) : q.toFixed(2));

function QRCode({ size = 180 }: { size?: number }) {
  const n = 25;
  let s = 91;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const inFinder = (x: number, y: number) =>
    [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);

  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() > 0.52) cells.push({ x, y });

  return (
    <Svg width={size} height={size} viewBox={`-1 -1 ${n + 2} ${n + 2}`}>
      <Rect x={-1} y={-1} width={n + 2} height={n + 2} fill="#fff" />
      {cells.map((c, i) => (
        <Rect key={i} x={c.x} y={c.y} width="1" height="1" fill={COLORS.t1} />
      ))}
      {[[0, 0], [n - 7, 0], [0, n - 7]].map(([fx, fy], i) => (
        <View key={i}>
          <Rect x={fx} y={fy} width="7" height="7" fill={COLORS.t1} />
          <Rect x={fx + 1} y={fy + 1} width="5" height="5" fill="#fff" />
          <Rect x={fx + 2} y={fy + 2} width="3" height="3" fill={COLORS.t1} />
        </View>
      ))}
    </Svg>
  );
}

export function WalletScreen({ onBack, onAsset }: WalletScreenProps) {
  const { holdings } = useBalances();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Screen
      onBack={onBack}
      title="Wallet"
      subtitle="Your self-custody address on Ethereum."
    >
      <Container style={{ alignItems: 'center' }}>
        <View style={styles.qrWrap}>
          <QRCode />
        </View>

        <View style={styles.addressRow}>
          <Text style={styles.address} numberOfLines={1}>
            {WALLET.slice(0, 6)}…{WALLET.slice(-4)}
          </Text>
          <Pressable onPress={copy} style={styles.copyBtn}>
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
          <Button label="Receive" icon="arrow-down-outline" onPress={copy} />
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
        {holdings.map((h, i) => (
          <ListRow
            key={h.symbol}
            leading={<CoinBadge symbol={h.symbol} />}
            title={h.symbol}
            subtitle={`${qtyFmt(h.amount)} ${h.symbol}`}
            value={fmtUSD(h.usdValue)}
            valueSub={fmtPct(h.change24h)}
            valueTone={h.change24h >= 0 ? 'up' : 'down'}
            onPress={() => onAsset(h.symbol)}
            last={i === holdings.length - 1}
          />
        ))}
      </Container>

      {copied && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
          <Text style={styles.toastText}>Address copied</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrWrap: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 20,
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
    backgroundColor: COLORS.t1,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 36,
  },
  copyText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: COLORS.t1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
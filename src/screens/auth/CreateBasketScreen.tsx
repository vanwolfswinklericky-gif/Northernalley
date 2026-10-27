// src/screens/auth/CreateBasketScreen.tsx

import { Button } from '@/components/ui/Button';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/theme';
import { useCreateBasket } from '@/hooks/useBaskets';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface CreateBasketScreenProps {
  onBack: () => void;
  onCreated: () => void;
}

const AVAILABLE_COINS = ['ETH', 'USDC', 'BTC', 'SOL', 'BNB'];

export function CreateBasketScreen({ onBack, onCreated }: CreateBasketScreenProps) {
  const [name, setName] = useState('');
  const [weights, setWeights] = useState<Record<string, number>>({
    ETH: 50,
    USDC: 50,
  });

  const { mutate: createBasket, isPending, error } = useCreateBasket();

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValid = name.length >= 2 && Math.abs(total - 100) < 0.5;

  const toggleCoin = (symbol: string) => {
    setWeights((prev) => {
      const next = { ...prev };
      if (next[symbol] !== undefined) {
        delete next[symbol];
      } else {
        next[symbol] = 0;
      }
      return next;
    });
  };

  const setWeight = (symbol: string, value: number) => {
    setWeights((prev) => ({ ...prev, [symbol]: Math.max(0, Math.min(100, value)) }));
  };

  const handleCreate = () => {
    const coins = Object.entries(weights)
      .filter(([_, w]) => w > 0)
      .map(([symbol, weight]) => ({ symbol, weight: weight / 100 }));

    createBasket(
      { name, coins },
      { onSuccess: onCreated }
    );
  };

  return (
    <Screen
      onBack={onBack}
      title="Create custom basket"
      subtitle="Pick coins and set weights. Total must equal 100%."
      footer={
        <Button
          label={isValid ? 'Create Basket' : `Total: ${total}% — must equal 100%`}
          disabled={!isValid}
          loading={isPending}
          onPress={handleCreate}
        />
      }
    >
      <Container style={{ marginBottom: 16 }}>
        <Text style={styles.label}>Basket name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="My custom basket"
          placeholderTextColor={COLORS.t3}
        />
      </Container>

      <Container>
        <Text style={styles.label}>Coins & weights</Text>

        {AVAILABLE_COINS.map((symbol) => {
          const isSelected = weights[symbol] !== undefined;
          return (
            <View key={symbol} style={styles.coinRow}>
              <Pressable onPress={() => toggleCoin(symbol)} style={styles.coinToggle}>
                <CoinBadge symbol={symbol} size={36} />
                <Text style={styles.coinSymbol}>{symbol}</Text>
                <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </Pressable>

              {isSelected && (
                <View style={styles.weightRow}>
                  <TextInput
                    style={styles.weightInput}
                    value={String(weights[symbol])}
                    onChangeText={(v) => setWeight(symbol, parseInt(v || '0', 10))}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.percent}>%</Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={[styles.totalValue, Math.abs(total - 100) < 0.5 && styles.totalOk]}>
            {total}%
          </Text>
        </View>

        {error && <Text style={styles.error}>{(error as Error).message}</Text>}
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    color: COLORS.t2,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    fontSize: 17,
    color: COLORS.t1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: 8,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  coinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  coinSymbol: { fontSize: 15, fontWeight: '500', color: COLORS.t1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weightInput: {
    width: 60,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.t1,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: 4,
  },
  percent: { fontSize: 15, color: COLORS.t2 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    marginTop: 12,
  },
  totalLabel: { fontSize: 15, fontWeight: '600', color: COLORS.t1 },
  totalValue: { fontSize: 15, fontWeight: '600', color: COLORS.danger },
  totalOk: { color: COLORS.up },
  error: { color: COLORS.danger, fontSize: 13, marginTop: 12 },
});
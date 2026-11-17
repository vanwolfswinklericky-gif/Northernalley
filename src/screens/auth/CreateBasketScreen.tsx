// src/screens/auth/CreateBasketScreen.tsx

import { Button } from '@/components/ui/Button';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS } from '@/constants/theme';
import { useCreateBasket } from '@/hooks/useBaskets';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface CreateBasketScreenProps {
  onBack: () => void;
  onCreated: () => void;
}

const AVAILABLE_COINS = ['BTC', 'ETH', 'USDC', 'SOL', 'BNB', 'XRP', 'AVAX'];

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
        next[symbol] = 0; // Start at 0 so they can slide it up
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
        <View style={{ paddingBottom: 24 }}>
          <Button
            label={isValid ? 'Create Basket' : `Total: ${total}% — must equal 100%`}
            disabled={!isValid}
            loading={isPending}
            onPress={handleCreate}
            variant="accent"
          />
        </View>
      }
    >
      {/* Basket Name Input */}
      <Container style={styles.card}>
        <Text style={styles.label}>Basket Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., My DeFi Picks"
          placeholderTextColor={COLORS.t3}
          maxLength={30}
        />
      </Container>

      {/* Coin Selection List */}
      <Container style={styles.card}>
        <Text style={styles.label}>Select Coins & Set Weights</Text>
        
        <View style={styles.coinList}>
          {AVAILABLE_COINS.map((symbol) => {
            const isSelected = weights[symbol] !== undefined;
            return (
              <View key={symbol} style={[styles.coinRow, isSelected && styles.coinRowActive]}>
                
                {/* Selection Left Side */}
                <Pressable onPress={() => toggleCoin(symbol)} style={styles.coinToggle}>
                  <CoinBadge symbol={symbol} size={36} />
                  <Text style={[styles.coinSymbol, isSelected && styles.coinSymbolActive]}>
                    {symbol}
                  </Text>
                </Pressable>

                {/* Weight Input Right Side */}
                {isSelected ? (
                  <View style={styles.weightRow}>
                    <TextInput
                      style={styles.weightInput}
                      value={String(weights[symbol])}
                      onChangeText={(v) => setWeight(symbol, parseInt(v || '0', 10))}
                      keyboardType="number-pad"
                      maxLength={3}
                      selectTextOnFocus
                    />
                    <Text style={styles.percent}>%</Text>
                  </View>
                ) : (
                  <View style={styles.checkbox}>
                    <Ionicons name="add" size={16} color={COLORS.t3} />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Live Total Calculation */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Allocation</Text>
          <View style={[styles.totalBadge, Math.abs(total - 100) < 0.5 ? styles.badgeOk : styles.badgeError]}>
            <Text style={[styles.totalValue, Math.abs(total - 100) < 0.5 ? styles.textOk : styles.textError]}>
              {total}%
            </Text>
          </View>
        </View>

        {error && (
          <Text style={styles.error}>{(error as Error).message}</Text>
        )}
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: RADIUS.xl,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.t1,
    marginBottom: 12,
  },
  input: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.t1,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent, // Purple underline
    paddingVertical: 8,
  },
  coinList: {
    gap: 10,
    marginTop: 4,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: COLORS.bg,
  },
  coinRowActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  coinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  coinSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.t2,
  },
  coinSymbolActive: {
    color: COLORS.t1,
    fontWeight: '700',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weightInput: {
    width: 60,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
    textAlign: 'right',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    paddingVertical: 2,
  },
  percent: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    marginTop: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.t1,
  },
  totalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  badgeOk: {
    backgroundColor: COLORS.upSoft,
  },
  badgeError: {
    backgroundColor: COLORS.downSoft,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  textOk: {
    color: COLORS.up,
  },
  textError: {
    color: COLORS.danger,
  },
  error: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
});
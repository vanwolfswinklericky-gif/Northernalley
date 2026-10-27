// src/screens/auth/AmountScreen.tsx

import { AmountPill } from '@/components/ui/AmountPill';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { AMOUNTS, fmtUSD } from '@/constants/baskets';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface AmountScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export function AmountScreen({ onBack, onContinue }: AmountScreenProps) {
  const amount = usePlanStore((s) => s.amount);
  const setAmount = usePlanStore((s) => s.setAmount);

  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Check if the current amount is one of the presets
  const isPreset = AMOUNTS.includes(amount as any);

  const handleCustomChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setCustomValue(numericText);
    
    const num = parseInt(numericText, 10);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    } else {
      setAmount(0); // Reset if empty or invalid
    }
  };

  const selectPreset = (presetAmount: number) => {
    setIsCustom(false);
    setCustomValue('');
    setAmount(presetAmount);
  };

  const yearly = (amount ?? 0) * 12;

  return (
    <Screen
      onBack={onBack}
      progress={6 / 10}
      title="How much each month?"
      subtitle="You can change or pause this any time."
      footer={
        <Button 
          label="Continue" 
          disabled={!amount || amount <= 0} 
          onPress={onContinue} 
        />
      }
    >
      <View style={styles.grid}>
        {AMOUNTS.map((a) => (
          <AmountPill
            key={a}
            amount={a}
            selected={!isCustom && amount === a}
            onPress={() => selectPreset(a)}
            tag={a === 100 ? 'Most popular' : 'per month'}
          />
        ))}

        {/* Custom Amount Pill */}
        <Pressable
          onPress={() => setIsCustom(true)}
          style={[
            styles.customCard,
            isCustom && styles.customCardSelected,
          ]}
        >
          <Text style={styles.customTitle}>Custom</Text>
          <Text style={styles.customSubtitle}>Set your own</Text>
        </Pressable>
      </View>

      {/* Custom Input Field */}
      {isCustom && (
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Enter monthly amount (USD)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              value={customValue}
              onChangeText={handleCustomChange}
              placeholder="150"
              placeholderTextColor={COLORS.t3}
              keyboardType="number-pad"
              autoFocus
              maxLength={6}
            />
          </View>
        </View>
      )}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          {amount && amount > 0 ? (
            <>
              That's <Text style={styles.noteStrong}>{fmtUSD(yearly, 0)}</Text> invested over
              the next 12 months.
            </>
          ) : (
            'Select or enter an amount to continue.'
          )}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  customCard: {
    flexBasis: '48%',
    height: 104,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.soft,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  customCardSelected: {
    backgroundColor: '#fff',
    borderColor: COLORS.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  customTitle: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.78,
    color: COLORS.t1,
  },
  customSubtitle: {
    fontSize: 12,
    color: COLORS.t2,
  },
  inputWrapper: {
    marginTop: SPACING.s4,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.t2,
    fontWeight: '500',
    marginBottom: SPACING.s2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    paddingBottom: SPACING.s2,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.t1,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.t1,
  },
  note: { marginTop: SPACING.s5, alignItems: 'center', minHeight: 20 },
  noteText: { fontSize: 14, color: COLORS.t2, textAlign: 'center' },
  noteStrong: { color: COLORS.t1, fontWeight: '600' },
});
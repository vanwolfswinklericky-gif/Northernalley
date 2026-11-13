// src/screens/auth/AmountScreen.tsx

import { AmountPill } from '@/components/ui/AmountPill';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { AMOUNTS, fmtUSD } from '@/constants/baskets';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

interface AmountScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export function AmountScreen({ onBack, onContinue }: AmountScreenProps) {
  const amount = usePlanStore((s) => s.amount);
  const setAmount = usePlanStore((s) => s.setAmount);
  const frequency = usePlanStore((s) => s.frequency);
  const setFrequency = usePlanStore((s) => s.setFrequency);
  const addOns = usePlanStore((s) => s.addOns);

  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleCustomChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setCustomValue(numericText);
    
    const num = parseInt(numericText, 10);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    } else {
      setAmount(0);
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
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} 
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Frequency Toggle */}
          <View style={styles.freqToggleContainer}>
            <Pressable
              style={[styles.freqBtn, frequency === 'monthly' && styles.freqBtnActive]}
              onPress={() => setFrequency('monthly')}
            >
              <Text style={frequency === 'monthly' ? styles.freqTextActive : styles.freqText}>Monthly</Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.freqBtn, 
                frequency === 'weekly' && styles.freqBtnActive,
                !addOns.weeklyDca && styles.freqBtnDisabled
              ]}
              onPress={() => addOns.weeklyDca && setFrequency('weekly')}
              disabled={!addOns.weeklyDca}
            >
              <Text style={
                !addOns.weeklyDca 
                  ? styles.freqTextDisabled 
                  : frequency === 'weekly' ? styles.freqTextActive : styles.freqText
              }>
                Weekly {!addOns.weeklyDca && '(Add-on required)'}
              </Text>
            </Pressable>
          </View>

          {/* Amount Grid */}
          <View style={styles.grid}>
            {AMOUNTS.map((a) => (
              <AmountPill
                key={a}
                amount={a}
                selected={!isCustom && amount === a}
                onPress={() => selectPreset(a)}
                tag={a === 100 ? 'Most popular' : frequency === 'weekly' ? 'per week' : 'per month'}
              />
            ))}

            <Pressable
              onPress={() => setIsCustom(true)}
              style={[styles.customCard, isCustom && styles.customCardSelected]}
            >
              <Text style={styles.customTitle}>Custom</Text>
              <Text style={styles.customSubtitle}>Set your own</Text>
            </Pressable>
          </View>

          {/* Custom Input */}
          {isCustom && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Enter {frequency} amount (USD)</Text>
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

          {/* Note Text */}
          <View style={styles.note}>
            <Text style={styles.noteText}>
              {amount && amount > 0 ? (
                <>
                  That's <Text style={styles.noteStrong}>{fmtUSD(frequency === 'monthly' ? yearly : yearly * 4)}</Text> invested over the next 12 months.
                </>
              ) : (
                'Select or enter an amount to continue.'
              )}
            </Text>
          </View>

          {/* Button pushed to the bottom of the scrollview */}
          <View style={styles.buttonContainer}>
            <Button 
              label="Continue" 
              disabled={!amount || amount <= 0} 
              onPress={onContinue} 
            />
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  freqToggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.soft,
    borderRadius: RADIUS.full,
    padding: 4,
    marginBottom: SPACING.s4,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  freqBtnActive: {
    backgroundColor: COLORS.accent,
  },
  freqBtnDisabled: {
    opacity: 0.5,
  },
  freqText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.t2,
  },
  freqTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  freqTextDisabled: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.t3,
  },
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
  note: { 
    marginTop: SPACING.s5, 
    alignItems: 'center', 
    minHeight: 20 
  },
  noteText: { 
    fontSize: 14, 
    color: COLORS.t2, 
    textAlign: 'center' 
  },
  noteStrong: { 
    color: COLORS.t1, 
    fontWeight: '600' 
  },
  // New container to push the button to the bottom
  buttonContainer: {
    marginTop: 'auto', 
    paddingTop: SPACING.s5,
    paddingBottom: SPACING.s4,
  },
});
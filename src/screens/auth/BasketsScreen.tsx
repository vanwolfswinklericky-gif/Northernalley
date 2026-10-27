// src/screens/auth/BasketsScreen.tsx

import { BasketCard } from '@/components/ui/BasketCard';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, SPACING } from '@/constants/theme';
import { useBaskets } from '@/hooks/useBaskets';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface BasketsScreenProps {
  onBack: () => void;
  onContinue: (basketId: string) => void;
  onCreateCustom: () => void;
}

export function BasketsScreen({ onBack, onContinue, onCreateCustom }: BasketsScreenProps) {
  const { data, isLoading, isError, refetch } = useBaskets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // --- Loading State ---
  if (isLoading) {
    return (
      <Screen onBack={onBack}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading your baskets...</Text>
        </View>
      </Screen>
    );
  }

  // --- Error State (No more crashes) ---
  if (isError || !data) {
    return (
      <Screen onBack={onBack}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorTitle}>Could not load baskets</Text>
          <Text style={styles.errorText}>
            There was a problem connecting to the server.
          </Text>
          <View style={{ marginTop: 24, width: '100%' }}>
            <Button label="Try Again" onPress={() => refetch()} />
          </View>
        </View>
      </Screen>
    );
  }

  // --- Safe Data Extraction ---
  const baskets = data.baskets ?? [];
  const plan = data.plan ?? 'starter';
  const limits = data.limits ?? { total: 1, custom: 0 };
  const usage = data.usage ?? { total: 0 };
  
  const canCreateCustom = plan === 'pro' || plan === 'premium';
  const atLimit = usage.total >= limits.total;
  const limitText = limits.total === Infinity ? 'unlimited' : limits.total;

  return (
    <Screen
      onBack={onBack}
      progress={5 / 10}
      title="Choose your basket"
      subtitle={`Your ${plan} plan includes ${limitText} basket${limits.total === 1 ? '' : 's'}.`}
      footer={
        <Button
          label="Continue"
          disabled={!selectedId}
          onPress={() => selectedId && onContinue(selectedId)}
        />
      }
    >
      {baskets.map((b) => (
        <BasketCard
          key={b.id}
          basket={b as any}
          selected={selectedId === b.id}
          onPress={() => setSelectedId(b.id)}
        />
      ))}

      {canCreateCustom && (
        <Pressable onPress={onCreateCustom} disabled={atLimit}>
          <Container style={[styles.createCard, atLimit && styles.disabled]}>
            <View style={styles.createIcon}>
              <Ionicons name="add" size={24} color={atLimit ? COLORS.t3 : COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.createTitle}>
                {atLimit ? 'Basket limit reached' : 'Create custom basket'}
              </Text>
              <Text style={styles.createSubtitle}>
                {atLimit ? 'Delete a basket or upgrade to add more' : 'Choose coins and set weights'}
              </Text>
            </View>
          </Container>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.s4 },
  loadingText: { fontSize: 14, color: COLORS.t2, marginTop: SPACING.s3 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: COLORS.t1, marginTop: SPACING.s3 },
  errorText: { fontSize: 14, color: COLORS.t2, textAlign: 'center', marginTop: SPACING.s2 },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.line,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    marginTop: 12,
  },
  disabled: { opacity: 0.5 },
  createIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTitle: { fontSize: 16, fontWeight: '600', color: COLORS.t1 },
  createSubtitle: { fontSize: 13, color: COLORS.t2, marginTop: 2 },
});
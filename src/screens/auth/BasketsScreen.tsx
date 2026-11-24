import { BasketCard } from '@/components/ui/BasketCard';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, SPACING } from '@/constants/theme';
import { useBaskets, type Basket } from '@/hooks/useBaskets';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface BasketsScreenProps {
  onBack: () => void;
  onContinue: (basket: Basket) => void;
  onCreateCustom: () => void;
}

export function BasketsScreen({ onBack, onContinue, onCreateCustom }: BasketsScreenProps) {
  const { data, isLoading, isError, error, refetch } = useBaskets();
  const [selectedBasket, setSelectedBasket] = useState<Basket | null>(null);
  const addOns = usePlanStore((state) => state.addOns);

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

  if (isError || !data) {
    return (
      <Screen onBack={onBack}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorTitle}>Could not load baskets</Text>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : 'Please check your connection.'}
          </Text>
          <View style={{ marginTop: 24, width: '100%' }}>
            <Button label="Try Again" onPress={() => refetch()} />
          </View>
        </View>
      </Screen>
    );
  }

  const baskets = data.baskets;
  const plan = data.plan;
  const limits = data.limits;
  const usage = data.usage;
  const hasExtraBasketAddon = addOns.extraBasket;
  const totalLimit = limits.total + (hasExtraBasketAddon ? 1 : 0);
  const canCreateCustom =
    (plan === 'pro' || plan === 'premium' || hasExtraBasketAddon) && usage.total < totalLimit;

  return (
    <Screen
      onBack={onBack}
      progress={5 / 10}
      title="Choose your basket"
      subtitle={`Your ${plan} plan includes ${
        totalLimit === Infinity ? 'unlimited' : totalLimit
      } basket${totalLimit === 1 ? '' : 's'}.`}
      footer={
        <Button
          label="Continue"
          disabled={!selectedBasket}
          onPress={() => {
            if (selectedBasket) onContinue(selectedBasket);
          }}
        />
      }
    >
      {baskets.map((basket) => (
        <BasketCard
          key={basket.id}
          basket={basket}
          selected={selectedBasket?.id === basket.id}
          onPress={() => setSelectedBasket(basket)}
        />
      ))}

      {canCreateCustom && (
        <Pressable onPress={onCreateCustom}>
          <Container style={styles.createCard}>
            <View style={styles.createIcon}>
              <Ionicons name="add" size={24} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.createTitle}>Create custom basket</Text>
              <Text style={styles.createSubtitle}>Choose coins and set weights</Text>
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

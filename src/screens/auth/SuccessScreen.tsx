// src/screens/auth/SuccessScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { StatusCircle } from '@/components/ui/StatusCircle';
import { SummaryRows } from '@/components/ui/SummaryRows';
import { basketById, fmtUSD } from '@/constants/baskets';
import { COLORS, TYPE } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { StyleSheet, Text, View } from 'react-native';

interface SuccessScreenProps {
  onGoToDashboard: () => void;
}

export function SuccessScreen({ onGoToDashboard }: SuccessScreenProps) {
  const { basketId, amount, email, reset } = usePlanStore();
  const b = basketById(basketId);

  const handleDone = () => {
    reset(); // Clears the plan store so the next purchase is fresh
    onGoToDashboard();
  };

  return (
    <Screen footer={<Button label="Go to Dashboard" variant="accent" onPress={handleDone} />}>
      <View style={styles.hero}>
        <StatusCircle kind="ok" />
        <Text style={styles.title}>You're all set</Text>
        <Text style={styles.sub}>
          Your subscription is active and your first investment is scheduled.
        </Text>
      </View>

      <Container>
        <SummaryRows
          rows={[
            ['Basket', b.name],
            ['Monthly amount', fmtUSD(amount ?? 0)],
            ['Next buy', 'In 1 month'],
            ['Receipt sent to', email ?? 'your email'],
          ]}
        />
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  title: { ...TYPE.h1, color: COLORS.t1, marginTop: 28 },
  sub: {
    fontSize: 15,
    color: COLORS.t2,
    maxWidth: 300,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
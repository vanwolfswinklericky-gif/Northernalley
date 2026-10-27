// src/screens/auth/OnboardingScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { LineChart, makeSeries } from '@/components/ui/LineChart';
import { COLORS } from '@/constants/theme';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OnboardingScreenProps {
  onStart: () => void;
  onSignIn: () => void;
}

export function OnboardingScreen({ onStart, onSignIn }: OnboardingScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <Image
            source={require('../../assets/images/splash-logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Northernalley</Text>
        </View>

        <View style={styles.hero}>
          <Container style={styles.previewCard}>
            <View style={styles.previewTop}>
              <Text style={styles.previewLabel}>Your next buy</Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>Nov 1</Text>
              </View>
            </View>
            <Text style={styles.previewAmount}>$100.00</Text>
            <LineChart data={makeSeries(7, 40, 0.006, 0.05)} height={70} />
          </Container>

          <Text style={styles.headline}>
            Build a crypto portfolio, one month at a time.
          </Text>
          <Text style={styles.subline}>
            Pick a basket, set an amount, and we'll invest for you automatically.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Get Started" variant="accent" onPress={onStart} />
        <Button label="I already have an account" variant="ghost" onPress={onSignIn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  brandName: {
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: -0.34,
    color: COLORS.t1,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  previewCard: {
    marginBottom: 40,
    maxWidth: 360,
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 13,
    color: COLORS.t2,
    fontWeight: '500',
  },
  chip: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.t2,
  },
  previewAmount: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.84,
    color: COLORS.t1,
  },
  headline: {
    fontSize: 44,
    lineHeight: 46,
    fontWeight: '600',
    letterSpacing: -1.4,
    maxWidth: 420,
    color: COLORS.t1,
  },
  subline: {
    fontSize: 17,
    color: COLORS.t2,
    marginTop: 16,
    maxWidth: 380,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 116,
    gap: 8,
  },
});
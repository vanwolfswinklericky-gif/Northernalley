// src/screens/app/AboutScreen.tsx

import { Container } from '@/components/ui/Container';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { COLORS, SPACING } from '@/constants/theme';
import { Alert, Linking, StyleSheet, Text } from 'react-native';

interface AboutScreenProps {
  onBack: () => void;
  onSupport: () => void;
}

export function AboutScreen({ onBack, onSupport }: AboutScreenProps) {
  const openEmail = async () => {
    try {
      const url = 'mailto:hello@northernalley.com';
      if (!(await Linking.canOpenURL(url))) throw new Error('No email app is available.');
      await Linking.openURL(url);
    } catch (error) {
      console.error('Unable to open the support email:', error);
      Alert.alert('Email unavailable', 'Please contact support@northernalley.com.');
    }
  };

  return (
    <Screen onBack={onBack} title="About Northernalley">
      <Container>
        <Text style={styles.h3}>Our story</Text>
        <Text style={styles.p}>
          Northernalley started with a simple belief: building wealth shouldn&apos;t require
          watching charts all day. Investing a steady amount every month is one of the
          oldest, calmest strategies there is — we just made it work for crypto.
        </Text>
      </Container>

      <Container style={{ marginTop: SPACING.s3 }}>
        <Text style={styles.h3}>Mission</Text>
        <Text style={styles.p}>
          Make long-term crypto investing quiet, transparent, and accessible to anyone
          with $50 a month.
        </Text>
      </Container>

      <SectionHeader title="Contact" />

      <Container flush>
        <ListRow
          icon="mail-outline"
          title="Email"
          subtitle="hello@northernalley.com"
          chevron
          onPress={openEmail}
        />
        <ListRow
          icon="help-buoy-outline"
          title="Help center"
          subtitle="Guides and FAQs"
          chevron
          onPress={onSupport}
        />
        <ListRow
          icon="location-outline"
          title="Office"
          subtitle="Toronto, Canada"
          last
        />
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h3: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.25,
    color: COLORS.t1,
    marginBottom: 8,
  },
  p: { fontSize: 15, lineHeight: 24, color: COLORS.t2 },
});
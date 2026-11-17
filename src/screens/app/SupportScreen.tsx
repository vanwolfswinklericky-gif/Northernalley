// src/screens/app/SupportScreen.tsx

import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

const FAQS = [
  {
    q: 'How does the DCA work?',
    a: 'Your DCA automatically buys the assets in your basket on a schedule (daily, weekly, or monthly). We use your saved card to fund each purchase.',
  },
  {
    q: 'When can I withdraw my funds?',
    a: 'You can withdraw anytime from the Wallet screen. A 2% withdrawal fee applies and funds arrive in your external wallet within a few minutes.',
  },
  {
    q: 'Why did my payment fail?',
    a: 'Common reasons: insufficient funds, expired card, or bank block. You can retry the payment or update your card in Settings > Payment Method.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'You can cancel anytime from Settings > Payment Method. Your access continues until the end of the current billing period.',
  },
];

interface SupportScreenProps {
  onBack: () => void;
}

export function SupportScreen({ onBack }: SupportScreenProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const handleContactSupport = async () => {
    try {
      const url = 'mailto:support@northernalley.com?subject=Support%20Request';
      if (!(await Linking.canOpenURL(url))) throw new Error('No email app is available.');
      await Linking.openURL(url);
    } catch (error) {
      console.error('Unable to open the support email:', error);
      Alert.alert('Email unavailable', 'Please email support@northernalley.com.');
    }
  };

  return (
    <Screen onBack={onBack} title="Help & Support">
      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      
      <Container style={styles.card}>
        {FAQS.map((faq, i) => {
          const isOpen = expanded === i;
          return (
            <Pressable
              key={i}
              style={[styles.faqRow, i === FAQS.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => setExpanded(isOpen ? null : i)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.accent}
                />
              </View>
              {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
            </Pressable>
          );
        })}
      </Container>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        Still need help?
      </Text>

      <Pressable style={styles.contactCard} onPress={handleContactSupport}>
        <View style={styles.contactIcon}>
          <Ionicons name="mail" size={24} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactTitle}>Contact Support</Text>
          <Text style={styles.contactSub}>We reply within 24 hours</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.t3} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.t1,
    marginBottom: 12,
  },
  card: {
    padding: 0,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
  },
  faqRow: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.t1,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.t2,
    lineHeight: 20,
    marginTop: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.t1,
  },
  contactSub: {
    fontSize: 13,
    color: COLORS.t2,
    marginTop: 2,
  },
});
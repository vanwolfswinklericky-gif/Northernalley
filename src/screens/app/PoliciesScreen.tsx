// src/screens/app/PoliciesScreen.tsx

import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PoliciesScreenProps {
  onBack: () => void;
}

const POLICIES: [string, string, string][] = [
  [
    'Terms of Service',
    'Updated Sep 2026',
    'By using Northernalley you agree to these terms. Northernalley provides a recurring purchase service for digital assets. We do not provide investment advice. You are responsible for evaluating whether a plan is suitable for you.',
  ],
  [
    'Privacy Policy',
    'Updated Aug 2026',
    'We collect only the information required to verify your identity, process payments, and operate your account. We never sell personal data. You can request a copy or deletion of your data at any time from Settings.',
  ],
  [
    'Risk Disclosure',
    'Updated Jul 2026',
    'Digital assets are highly volatile. The value of your portfolio may go up or down, and you may lose some or all of the money you invest. Past performance does not guarantee future results.',
  ],
  [
    'Fee Schedule',
    'Updated Jul 2026',
    'A 1.5% service fee is included in each purchase. There are no account, custody, or withdrawal fees charged by Northernalley. Network fees may apply when sending assets.',
  ],
  [
    'Cookie Policy',
    'Updated Jun 2026',
    'Our app uses minimal local storage to keep you signed in and remember preferences. We do not use third-party advertising trackers.',
  ],
];

export function PoliciesScreen({ onBack }: PoliciesScreenProps) {
  const [open, setOpen] = useState(0);

  return (
    <Screen
      onBack={onBack}
      title="Policies"
      subtitle="The legal bits, in plain language where possible."
    >
      <Container flush>
        {POLICIES.map(([title, date, body], i) => {
          const isOpen = open === i;
          return (
            <View
              key={title}
              style={[
                styles.row,
                i < POLICIES.length - 1 && styles.divider,
              ]}
            >
              <Pressable
                onPress={() => setOpen(isOpen ? -1 : i)}
                style={styles.head}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.date}>{date}</Text>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.t2}
                />
              </Pressable>
              {isOpen && <Text style={styles.body}>{body}</Text>}
            </View>
          );
        })}
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 24 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  head: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 12 },
  title: { fontSize: 15, fontWeight: '500', color: COLORS.t1 },
  date: { fontSize: 13, color: COLORS.t3, marginTop: 2 },
  body: { fontSize: 14, lineHeight: 22, color: COLORS.t2, paddingBottom: 18 },
});
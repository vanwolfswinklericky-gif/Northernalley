// src/screens/app/SupportScreen.tsx

import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

const FAQS = [
  {
    q: 'What is NorthernAlley?',
    a: 'NorthernAlley is a recurring crypto investing app. You choose a plan, select or create a basket of digital assets, set a purchase amount, and choose how often NorthernAlley should invest. The app also shows your wallet balance and portfolio value. NorthernAlley provides an investing service, not investment advice.',
  },
  {
    q: 'How does dollar-cost averaging (DCA) work?',
    a: 'DCA divides your selected investment amount into scheduled purchases instead of requiring you to invest everything at once. For example, if you choose a monthly €100 plan, NorthernAlley invests €100 each month according to your selected basket. Monthly DCA is available on the Free and Starter plans, weekly DCA is included with Pro and Premium or available as a Starter add-on, and daily DCA is available with Premium.',
  },
  {
    q: 'Which plan should I choose?',
    a: 'Free supports 1 active basket and monthly DCA, with a maximum recurring investment of €1,000 per month. Starter supports 2 baskets and monthly DCA. Pro supports 3 baskets, weekly DCA, custom baskets, portfolio history, tax reports, price alerts, and 12-hour priority support. Premium supports unlimited baskets, daily DCA, custom baskets, instant-buy features, tax reports, price alerts, and 4-hour priority support. Paid plan investment limits are up to €100,000.',
  },
  {
    q: 'What are the optional add-ons?',
    a: 'Paid plans can add an extra basket for €4.99 per month and priority support for €9.99 per month. Weekly DCA costs €7.99 per month on plans that do not already include it. Pro and Premium already include weekly DCA, so the app marks that add-on as included rather than charging for it. Add-on selections are added to your total before checkout.',
  },
  {
    q: 'How much is charged at checkout?',
    a: 'The total due includes the monthly subscription, any selected add-ons, your first investment deposit, and a 1% deposit fee. For example, a €100 deposit on a paid plan will show the €100 deposit plus a €1.00 deposit fee, together with the applicable subscription and add-on charges. Checkout and card details are handled securely through Stripe.',
  },
  {
    q: 'How do I update my card or manage billing?',
    a: 'Open Settings, then tap Payment Method. If you have an active paid subscription, NorthernAlley opens the Stripe billing portal where you can manage billing details and payment methods. If no active paid plan is detected, the app takes you to plan selection instead.',
  },
  {
    q: 'How do I cancel or change my plan?',
    a: 'Open Settings and tap Payment Method to open Stripe billing for an active paid subscription. You can also contact us at info@northernalley.com if you need help confirming a cancellation or selecting another plan. Canceling a plan stops the subscription according to Stripe’s billing status; review the billing portal for the effective end date. Plan features and basket limits may change when the new plan becomes active.',
  },
  {
    q: 'Why did a payment fail?',
    a: 'A payment can fail due to insufficient funds, an expired or declined card, an incorrect card detail, an additional verification requirement, or a block by your bank. Confirm that the card is valid, allow the purchase in your banking app if prompted, or update the payment method through Settings > Payment Method. If the charge remains pending or was taken twice, contact info@northernalley.com with the billing date and amount.',
  },
  {
    q: 'How do baskets and custom baskets work?',
    a: 'A basket is a portfolio allocation made from supported digital assets. Preset baskets can be selected during onboarding. Custom baskets are available on Pro, Premium, or with an extra-basket add-on. A custom basket requires a name and coin allocations that add up to exactly 100%. Available custom coins include BTC, ETH, USDC, SOL, BNB, XRP, and AVAX.',
  },
  {
    q: 'Where can I find and receive crypto?',
    a: 'Open Settings > Wallet or the Wallet tab. The app displays your NorthernAlley embedded Ethereum wallet address and QR code. Receive ETH or USDC on Base mainnet only. Sending assets to another network or using unsupported tokens may cause them not to appear in your NorthernAlley balance.',
  },
  {
    q: 'Can I send or withdraw crypto from the app?',
    a: 'The Wallet screen currently has a Send button, but sending crypto is not available yet in the app. Do not rely on the app for an external transfer, and do not send funds to a new or unverified wallet until you contact support. Some network fees or transfer limitations may be handled outside NorthernAlley. Email info@northernalley.com before moving significant funds or requesting help with a transfer.',
  },
  {
    q: 'Can I add crypto directly from an exchange or another wallet?',
    a: 'You can copy your wallet address and send supported assets from another wallet or exchange, but only if it supports transfers to Base mainnet. Make sure the asset is ETH or USDC and that the selected destination network is Base. NorthernAlley shows supported basket balances after they are detected; unsupported assets may not be included in the portfolio total.',
  },
  {
    q: 'Why is an asset missing or marked unsupported?',
    a: 'The wallet balance service tracks supported basket assets on Base. Assets on other networks, unsupported tokens, or assets that have not been confirmed on-chain may not appear. Network congestion or temporary price-provider issues can also delay or prevent a value from updating. Unsupported assets are listed separately when detected, and the app refreshes balances periodically.',
  },
  {
    q: 'Why is the portfolio value or price different from another app?',
    a: 'Prices can change constantly and are collected from market price providers. Small differences are normal due to timing, exchange source, or USD/EUR display settings. The app’s chart ranges and history use available portfolio data; live market values and recorded balances may update at different times.',
  },
  {
    q: 'What is the wallet recovery passcode?',
    a: 'Your recovery passcode is an 8-digit code used with your NorthernAlley account to recover the embedded wallet on a new device. Set or change it from Settings > Wallet recovery passcode. It must match the confirmation entry before it can be saved. NorthernAlley does not store this passcode, so keep it private and in a secure place.',
  },
  {
    q: 'I forgot my wallet recovery passcode. Can support reset it?',
    a: 'NorthernAlley cannot view or retrieve your passcode. Sign in to your account and try any passkey or other Privy recovery method already linked to your account. If no backup method is available, the wallet may be unrecoverable. Email info@northernalley.com for guidance, but never send your recovery passcode or seed phrase by email.',
  },
  {
    q: 'How do Face ID or fingerprint login work?',
    a: 'Open Settings and turn on Face ID / Fingerprint. The app uses passkey-based MFA to enable biometric authentication. If no passkey is linked yet, the app attempts to link one and enroll it for MFA. To disable it, use the same toggle or unenroll the passkey in your account security settings.',
  },
  {
    q: 'How do notifications work?',
    a: 'Enable Notifications from Settings to register your device for NorthernAlley alerts. If the permission is denied or unavailable, turn notifications on in your device’s system settings and try again. Disabling the toggle in the app stops NorthernAlley’s notification preference in the app, while OS-level permissions may need to be changed separately.',
  },
  {
    q: 'Can I change my profile or delete my account?',
    a: 'Open Settings > Profile to update your display name and profile photo. Your email address is connected to the signed-in account and is not editable in the profile form. To permanently delete the account, open Profile and use Delete Account in the Danger Zone. The app asks for confirmation because deletion cannot be undone and associated app data may be lost.',
  },
  {
    q: 'What fees does NorthernAlley charge?',
    a: 'There is a 1% deposit fee shown during checkout, a monthly subscription based on the plan and add-ons, and a 1.5% service fee described in the app’s Fee Schedule policy. NorthernAlley states that it charges no separate account or custody fee and no additional withdrawal fee; network fees may apply to sending assets. Subscription and transaction terms can change, so review the Policies page and checkout summary before confirming.',
  },
];

interface SupportScreenProps {
  onBack: () => void;
}

export function SupportScreen({ onBack }: SupportScreenProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const handleContactSupport = async () => {
    try {
      const url = 'mailto:info@northernalley.com?subject=NorthernAlley%20Support%20Request';
      if (!(await Linking.canOpenURL(url))) throw new Error('No email app is available.');
      await Linking.openURL(url);
    } catch (error) {
      console.error('Unable to open the support email:', error);
      Alert.alert('Email unavailable', 'Please email info@northernalley.com.');
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
          <Text style={styles.contactSub}>Email info@northernalley.com</Text>
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
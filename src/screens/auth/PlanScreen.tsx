// src/screens/auth/PlanScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, SPACING } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PlanScreenProps {
  onBack: () => void;
  onContinue: (plan: 'starter' | 'pro' | 'premium') => void;
  onSkip: () => void;
}

interface PlanFeature {
  label: string;
  value: string;
  included: boolean;
}

interface PlanDef {
  id: 'starter' | 'pro' | 'premium';
  name: string;
  price: number;
  tagline: string;
  highlights: string[];
  details: PlanFeature[];
  recommended?: boolean;
}

const PLANS: PlanDef[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19.99,
    tagline: 'Perfect for getting started',
    highlights: ['1 active basket', 'Monthly DCA', 'Full portfolio view', 'Email support (48h)'],
    details: [
      { label: 'Active baskets', value: '1', included: true },
      { label: 'DCA frequency', value: 'Monthly', included: true },
      { label: 'Custom basket builder', value: '—', included: false },
      { label: 'Instant buy', value: 'Add-on $2.99', included: true },
      { label: 'Portfolio history (all-time)', value: '—', included: false },
      { label: 'Tax report (CSV)', value: 'Add-on $19.99', included: true },
      { label: 'Price alerts', value: '—', included: false },
      { label: 'Support response time', value: '48 hours', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39.99,
    tagline: 'For active investors',
    highlights: ['3 active baskets', 'Weekly DCA included', 'Custom basket builder', 'Tax report (CSV)', 'Priority support (12h)'],
    recommended: true,
    details: [
      { label: 'Active baskets', value: '3', included: true },
      { label: 'DCA frequency', value: 'Weekly', included: true },
      { label: 'Custom basket builder', value: '1 included', included: true },
      { label: 'Instant buy', value: 'Add-on $2.99', included: true },
      { label: 'Portfolio history (all-time)', value: 'Yes', included: true },
      { label: 'Tax report (CSV)', value: '1/year', included: true },
      { label: 'Price alerts', value: 'Up to 5 assets', included: true },
      { label: 'Support response time', value: '12 hours', included: true },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79.99,
    tagline: 'For serious portfolios',
    highlights: ['Unlimited baskets', 'Daily DCA included', 'Instant buy included', 'Priority support (4h)', 'Concierge onboarding'],
    details: [
      { label: 'Active baskets', value: 'Unlimited', included: true },
      { label: 'DCA frequency', value: 'Daily', included: true },
      { label: 'Custom basket builder', value: 'Unlimited', included: true },
      { label: 'Instant buy', value: 'Included', included: true },
      { label: 'Portfolio history (all-time)', value: 'Yes', included: true },
      { label: 'Tax report (CSV)', value: 'Unlimited', included: true },
      { label: 'Price alerts', value: 'Unlimited', included: true },
      { label: 'Support response time', value: '4 hours', included: true },
    ],
  },
];

export function PlanScreen({ onBack, onContinue, onSkip }: PlanScreenProps) {
  // 1. Default to 'starter' to match the first card visually
  const [selected, setSelected] = useState<'starter' | 'pro' | 'premium'>('starter');
  const [expanded, setExpanded] = useState<string | null>(null);
  
  const { addOns, toggleAddOn } = usePlanStore();

  const toggleExpand = (id: string) => {
    setExpanded((current) => (current === id ? null : id));
  };

  const selectedPlanObj = PLANS.find((p) => p.id === selected);
  const basePrice = selectedPlanObj ? selectedPlanObj.price : 0;
  
  // 2. Safely calculate the add-on price (Ignore weekly DCA if Pro/Premium)
  const isWeeklyDcaIncluded = selected === 'pro' || selected === 'premium';
  
  const addOnPrice = 
    (addOns.extraBasket ? 4.99 : 0) + 
    (!isWeeklyDcaIncluded && addOns.weeklyDca ? 7.99 : 0) + 
    (addOns.prioritySupport ? 9.99 : 0);
    
  const totalPrice = basePrice + addOnPrice;

  return (
    <Screen
      onBack={onBack}
      progress={3 / 10}
      title="Choose your plan"
      subtitle="You can change or cancel anytime."
      footer={
        <View style={{ paddingBottom: 24, gap: 12 }}>
          <Button
            label={`Continue — $${totalPrice.toFixed(2)}/mo`}
            variant="accent"
            onPress={() => onContinue(selected)}
          />
          <Button
            label="Skip for now"
            variant="ghost"
            onPress={onSkip}
          />
        </View>
      }
    >
      {PLANS.map((plan) => {
        const isSelected = selected === plan.id;
        const isExpanded = expanded === plan.id;

        return (
          <View key={plan.id} style={styles.cardWrap}>
            <Pressable onPress={() => setSelected(plan.id)}>
              <Container style={[styles.card, isSelected && styles.cardSelected]}>
                {plan.recommended && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>MOST POPULAR</Text>
                  </View>
                )}

                <View style={styles.head}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{plan.name}</Text>
                    <Text style={styles.tagline}>{plan.tagline}</Text>
                  </View>
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleOn]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>${plan.price}</Text>
                  <Text style={styles.per}>/month</Text>
                </View>

                <View style={styles.features}>
                  {plan.highlights.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>

                {/* 3. INLINE ADD-ONS (Only show inside the currently selected card) */}
                {isSelected && (
                  <View style={styles.inlineAddOns}>
                    <Text style={styles.inlineAddOnsTitle}>Optional Add-ons</Text>
                    
                    {/* Extra Basket Addon */}
                    <Pressable 
                      style={[styles.inlineAddOnRow, addOns.extraBasket && styles.inlineAddOnRowActive]} 
                      onPress={() => toggleAddOn('extraBasket')}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addOnText}>Extra Basket</Text>
                      </View>
                      <Text style={styles.addOnPriceText}>+$4.99</Text>
                      <View style={[styles.plusBtn, addOns.extraBasket && styles.plusBtnActive]}>
                        <Ionicons name={addOns.extraBasket ? "checkmark" : "add"} size={14} color={addOns.extraBasket ? "#fff" : COLORS.accent} />
                      </View>
                    </Pressable>

                    {/* Weekly DCA Addon */}
                    <Pressable 
                      style={[
                        styles.inlineAddOnRow, 
                        isWeeklyDcaIncluded && { opacity: 0.6, backgroundColor: COLORS.soft },
                        !isWeeklyDcaIncluded && addOns.weeklyDca && styles.inlineAddOnRowActive
                      ]} 
                      onPress={() => !isWeeklyDcaIncluded && toggleAddOn('weeklyDca')}
                      disabled={isWeeklyDcaIncluded}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.addOnText, isWeeklyDcaIncluded && { textDecorationLine: 'line-through', color: COLORS.t3 }]}>
                          Weekly DCA {isWeeklyDcaIncluded && "(Included)"}
                        </Text>
                      </View>
                      {!isWeeklyDcaIncluded ? (
                        <>
                          <Text style={styles.addOnPriceText}>+$7.99</Text>
                          <View style={[styles.plusBtn, addOns.weeklyDca && styles.plusBtnActive]}>
                            <Ionicons name={addOns.weeklyDca ? "checkmark" : "add"} size={14} color={addOns.weeklyDca ? "#fff" : COLORS.accent} />
                          </View>
                        </>
                      ) : (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.up} />
                      )}
                    </Pressable>

                    {/* Priority Support Addon */}
                    <Pressable 
                      style={[styles.inlineAddOnRow, addOns.prioritySupport && styles.inlineAddOnRowActive]} 
                      onPress={() => toggleAddOn('prioritySupport')}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addOnText}>Priority Support</Text>
                      </View>
                      <Text style={styles.addOnPriceText}>+$9.99</Text>
                      <View style={[styles.plusBtn, addOns.prioritySupport && styles.plusBtnActive]}>
                        <Ionicons name={addOns.prioritySupport ? "checkmark" : "add"} size={14} color={addOns.prioritySupport ? "#fff" : COLORS.accent} />
                      </View>
                    </Pressable>
                  </View>
                )}

                <Pressable onPress={() => toggleExpand(plan.id)} style={styles.expandRow}>
                  <Text style={styles.expandText}>{isExpanded ? 'Hide details' : 'See full details'}</Text>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.accent} />
                </Pressable>
              </Container>
            </Pressable>

            {isExpanded && (
              <View style={styles.detailsWrap}>
                {plan.details.map((d, i) => (
                  <View key={d.label} style={[styles.detailRow, i === plan.details.length - 1 && styles.detailRowLast]}>
                    <Text style={styles.detailLabel}>{d.label}</Text>
                    <Text style={[styles.detailValue, !d.included && styles.detailValueMuted]}>{d.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <Text style={styles.note}>
        All plans include a free 7-day trial. Cancel anytime from Settings.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardWrap: { marginBottom: 12 },
  card: {},
  cardSelected: { borderColor: COLORS.accent, borderWidth: 2 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.accentText, letterSpacing: 0.6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.t1, letterSpacing: -0.4 },
  tagline: { fontSize: 13, color: COLORS.t2, marginTop: 2 },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleOn: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 16 },
  price: { fontSize: 28, fontWeight: '700', color: COLORS.t1, letterSpacing: -0.8 },
  per: { fontSize: 14, color: COLORS.t2, fontWeight: '500' },
  features: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: COLORS.t1 },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  expandText: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  detailsWrap: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 20,
    marginTop: -8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 13, color: COLORS.t2, flex: 1, paddingRight: 12 },
  detailValue: { fontSize: 13, fontWeight: '600', color: COLORS.t1, textAlign: 'right' },
  detailValueMuted: { color: COLORS.t3, fontWeight: '500' },
  note: { fontSize: 12, color: COLORS.t3, textAlign: 'center', marginTop: SPACING.s3, paddingHorizontal: SPACING.s4, lineHeight: 18 },

  // Inline Add-ons Styles
  inlineAddOns: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    gap: 8,
  },
  inlineAddOnsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.t2,
    marginBottom: 4,
  },
  inlineAddOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  inlineAddOnRowActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentMedium,
  },
  addOnText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accentText,
  },
  addOnPriceText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accentText,
  },
  plusBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  plusBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
});
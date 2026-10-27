// src/screens/app/SettingsScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CURRENCIES } from '@/constants/currencies';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useSubscription } from '@/hooks/useSubscription';
import { usePlanStore } from '@/store/planStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/expo';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

interface SettingsScreenProps {
  onTab: (key: string) => void;
  onProfile: () => void;
  onWallet: () => void;
  onAbout: () => void;
  onPolicies: () => void;
  onPlan: () => void;
  onSignOut: () => void;
}

export function SettingsScreen({
  onTab, onProfile, onWallet, onAbout, onPolicies, onPlan, onSignOut,
}: SettingsScreenProps) {
  const { user, logout } = usePrivy();
  const { plan, status } = useSubscription();
  const { rates, isLoading: ratesLoading } = useExchangeRates();
  
  // Zustand stores
  const { currency, setCurrency, reset: clearPlan } = usePlanStore();
  const clearPortfolio = usePortfolioStore((s) => s.clear);

  const [notif, setNotif] = useState(true);
  const [bio, setBio] = useState(true);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPortal, setLoadingPortal] = useState(false);

  // FIX: Cast user to 'any' for the email property
  const email = (user as any)?.email?.address || 'user@example.com';
  const initials = email.substring(0, 2).toUpperCase();

  const availableCurrencies = Object.keys(rates).map((code) => {
    const meta = CURRENCIES.find((c) => c.code === code);
    return { code, name: meta?.name || code, symbol: meta?.symbol || code };
  }).sort((a, b) => a.code.localeCompare(b.code));

  const activeCurrencyMeta = availableCurrencies.find((c) => c.code === currency);
  const activeSymbol = activeCurrencyMeta?.symbol || currency;

  const tabs = <FloatingTabBar active="settings" onChange={onTab} />;

  const handleOpenBilling = async () => {
    if (!user?.id) return;
    setLoadingPortal(true);
    try {
      const res = await fetch(`${API_URL}/api/billing-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyUserId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        await Linking.openURL(data.url);
      } else {
        Alert.alert('No Plan Found', 'You need an active subscription to manage payment methods.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open billing portal.');
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@northernalley.com?subject=Help with my Northernalley Account');
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive',
        onPress: async () => {
          await logout();
          clearPlan();
          clearPortfolio();
          onSignOut();
        } 
      },
    ]);
  };

  const filteredCurrencies = searchQuery 
    ? availableCurrencies.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase()) || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : availableCurrencies;

  return (
    <Screen title="Settings" tabs={tabs}>
      
      {/* 1. Dynamic Profile Card */}
      <Container onPress={onProfile} style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{email.split('@')[0]}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.t3} />
      </Container>

      {/* 2. Subscription Banner */}
      <Container style={styles.subCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Current Subscription</Text>
          <Text style={styles.subName}>
            {plan ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan` : 'No Active Plan'}
          </Text>
        </View>
        <View style={[styles.subBadge, status === 'active' ? styles.subBadgeActive : styles.subBadgeInactive]}>
          <Text style={[styles.subBadgeText, { color: status === 'active' ? COLORS.up : COLORS.t2 }]}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </Container>

      <SectionHeader title="Account" />
      <Container flush>
        <ListRow icon="person-outline" title="Profile" chevron onPress={onProfile} />
        <ListRow icon="wallet-outline" title="Wallet" subtitle="0x7F3a…9B42" chevron onPress={onWallet} />
        <ListRow icon="repeat-outline" title="Recurring plan" subtitle="Manage investment" chevron onPress={onPlan} />
        
        <ListRow 
          icon="card-outline" 
          title="Payment method" 
          subtitle={loadingPortal ? "Opening portal..." : "Manage cards & billing"} 
          chevron 
          onPress={handleOpenBilling} 
          last 
        />
      </Container>

      <SectionHeader title="App" />
      <Container flush>
        <ListRow icon="notifications-outline" title="Notifications" toggle={notif} onToggle={setNotif} />
        <ListRow icon="finger-print-outline" title="Face ID" toggle={bio} onToggle={setBio} />
        
        <ListRow 
          icon="cash-outline" 
          title="Currency" 
          value={`${activeSymbol} ${currency}`} 
          chevron 
          onPress={() => setShowCurrencyModal(true)} 
          last 
        />
      </Container>

      <SectionHeader title="Company" />
      <Container flush>
        <ListRow icon="information-circle-outline" title="About Northernalley" chevron onPress={onAbout} />
        <ListRow icon="document-text-outline" title="Policies" chevron onPress={onPolicies} />
        <ListRow icon="chatbubble-outline" title="Contact support" chevron onPress={handleSupport} last />
      </Container>

      {/* 3. Working Sign Out */}
      <View style={{ marginTop: 32 }}>
        <Button label="Sign Out" variant="danger" onPress={handleSignOut} />
      </View>

      <Text style={styles.version}>Version 1.0.0 (Production)</Text>
      <Text style={styles.attribution} onPress={() => Linking.openURL('https://www.exchangerate-api.com')}>
        Rates By Exchange Rate API
      </Text>

      {/* Currency Modal */}
      <Modal visible={showCurrencyModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <Pressable onPress={() => setShowCurrencyModal(false)} hitSlop={8}>
              <Ionicons name="close-circle" size={28} color={COLORS.t2} />
            </Pressable>
          </View>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={COLORS.t3} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search currency..."
              placeholderTextColor={COLORS.t3}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>
          {ratesLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={COLORS.accent} /></View>
          ) : (
            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item.code}
              contentContainerStyle={{ padding: SPACING.md }}
              renderItem={({ item }) => {
                const isActive = currency === item.code;
                return (
                  <Pressable 
                    style={[styles.currencyRow, isActive && styles.currencyRowActive]}
                    onPress={() => { setCurrency(item.code); setShowCurrencyModal(false); setSearchQuery(''); }}
                  >
                    <View style={styles.currencyRowLeft}>
                      <Text style={styles.currencySymbol}>{item.symbol}</Text>
                      <View>
                        <Text style={styles.currencyCode}>{item.code}</Text>
                        <Text style={styles.currencyName}>{item.name}</Text>
                      </View>
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={24} color={COLORS.accent} />}
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: COLORS.t2, marginTop: 24 }}>No currencies found.</Text>}
            />
          )}
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 20 },
  profileName: { fontSize: 17, fontWeight: '600', color: COLORS.t1, textTransform: 'capitalize' },
  profileEmail: { fontSize: 13, color: COLORS.t2, marginTop: 2 },
  
  label: { fontSize: 13, color: COLORS.t2, fontWeight: '500' },
  subCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 20 },
  subName: { fontSize: 18, fontWeight: '600', color: COLORS.t1, marginTop: 4 },
  subBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  subBadgeActive: { backgroundColor: COLORS.upSoft },
  subBadgeInactive: { backgroundColor: COLORS.soft },
  subBadgeText: { fontSize: 12, fontWeight: '700' },

  version: { textAlign: 'center', fontSize: 12, color: COLORS.t3, marginTop: SPACING.s3 },
  attribution: { textAlign: 'center', fontSize: 11, color: COLORS.t3, marginTop: 8, textDecorationLine: 'underline' },

  modalSafe: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  modalTitle: { fontSize: 20, fontWeight: '600', color: COLORS.t1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.soft, margin: SPACING.md, paddingHorizontal: SPACING.md, height: 48, borderRadius: RADIUS.md },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.t1 },
  currencyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, marginBottom: 4 },
  currencyRowActive: { backgroundColor: COLORS.accentSoft },
  currencyRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  currencySymbol: { fontSize: 20, fontWeight: '600', color: COLORS.t1, width: 40, textAlign: 'center' },
  currencyCode: { fontSize: 16, fontWeight: '600', color: COLORS.t1 },
  currencyName: { fontSize: 13, color: COLORS.t2, marginTop: 2 },
});
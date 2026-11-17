// src/screens/app/SettingsScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useSubscription } from '@/hooks/useSubscription';
import { registerForPushNotifications } from '@/lib/notifications';
import { usePlanStore } from '@/store/planStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllUserEmbeddedEthereumWallets,
  useMfaEnrollment,
  usePrivy,
} from '@privy-io/expo';
import { useLinkWithPasskey } from '@privy-io/expo/passkey';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Linking, Modal,
  Pressable, SafeAreaView, StyleSheet, Text, TextInput, View
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

interface SettingsScreenProps {
  onProfile: () => void;
  onWallet: () => void;
  onAbout: () => void;
  onPolicies: () => void;
  onPlan: () => void;
  onSupport: () => void;
  onSignOut: () => void;
}

export function SettingsScreen({
  onProfile, onWallet, onAbout, onPolicies, onPlan, onSupport, onSignOut,
}: SettingsScreenProps) {
  const { user, logout } = usePrivy();
  const { plan, status } = useSubscription();
  const { rates, isLoading: ratesLoading, currency } = useExchangeRates();
  const { setCurrency, reset: clearPlan } = usePlanStore();
  const clearPortfolio = usePortfolioStore((s) => s.clear);

  const { linkWithPasskey } = useLinkWithPasskey();
  const { initMfaEnrollment, submitMfaEnrollment, unenrollMfa } = useMfaEnrollment();

  const [dbUser, setDbUser] = useState<{ name: string; email: string; avatarUrl?: string } | null>(null);
  
  const [notif, setNotif] = useState(false);
  const [bioOverride, setBioOverride] = useState<boolean | null>(null);
  const [loadingBio, setLoadingBio] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPortal, setLoadingPortal] = useState(false);

  // 1. Fetch user data
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/me?privyUserId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setDbUser({
            name: data.user.name || 'NorthernAlley User',
            email: data.user.email || (user as any).email?.address || 'No email',
            avatarUrl: data.user.avatarUrl,
          });
        }
      })
      .catch(console.error);
  }, [user]);

  const hasPasskeyMfa = (user as any)?.mfaMethods?.includes('passkey') ?? false;
  const bio = bioOverride ?? hasPasskeyMfa;

  // 3. Real Biometric Toggle Flow
  const handleBiometricToggle = async () => {
    if (!user) return;
    setLoadingBio(true);

    try {
      if (!bio) {
        // --- TURNING ON ---
        const hasPasskeyLinked = user.linked_accounts?.some(
          (account) => account.type === 'passkey'
        );

        if (!hasPasskeyLinked) {
          await linkWithPasskey({
            relyingParty: 'https://northernalley.vercel.app',
          });
        }

        await initMfaEnrollment({ method: 'passkey' });
        
        const credentialIds = (user.linked_accounts || [])
          .filter((account) => account.type === 'passkey')
          .map((account) => account.credential_id);

        if (credentialIds.length === 0) {
          throw new Error('No passkey credential found after linking.');
        }

        await submitMfaEnrollment({ method: 'passkey', credentialIds });
        setBioOverride(true);
        Alert.alert('Success', 'Biometric MFA enabled.');
      } else {
        // --- TURNING OFF ---
        await unenrollMfa({ method: 'passkey', removeForLogin: false });
        setBioOverride(false);
        Alert.alert('Disabled', 'Biometric MFA has been turned off.');
      }
    } catch (err: any) {
      console.error('Passkey Error:', err);
      Alert.alert('Error', err.message || 'Could not update biometric settings.');
    } finally {
      setLoadingBio(false);
    }
  };

  const handleNotifToggle = async (value: boolean) => {
    if (value) {
      if (!user?.id) return;
      try {
        const token = await registerForPushNotifications(user.id);
        if (token) {
          setNotif(true);
        } else {
          Alert.alert('Notifications unavailable', 'Please enable notifications in your device settings.');
        }
      } catch (error) {
        console.error('Notification registration failed:', error);
        Alert.alert('Error', 'Could not enable notifications. Please try again.');
      }
    } else {
      setNotif(false);
    }
  };

  // 4. Fixed Payment Method logic
  const handleOpenBilling = async () => {
    if (!user?.id) return;

    if (!plan || status !== 'active') {
      onPlan();
      return;
    }

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
        Alert.alert('Error', 'No billing data found.');
      }
    } catch {
      Alert.alert('Error', 'Could not open billing portal.');
    } finally {
      setLoadingPortal(false);
    }
  };

  // 5. Sign Out
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            if (user?.id) {
              const response = await fetch(`${API_URL}/auth/signout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ privyUserId: user.id }),
              });
              if (!response.ok) {
                console.warn(`Server-side sign-out failed (HTTP ${response.status}).`);
              }
            }
            await logout();
            clearPlan();
            clearPortfolio();
            onSignOut();
          } catch (error) {
            console.error('Sign-out failed:', error);
            Alert.alert('Sign Out Failed', 'Please try again.');
          }
        },
      },
    ]);
  };

  const walletAddress = user
    ? getAllUserEmbeddedEthereumWallets(user)[0]?.address ?? null
    : null;
  const truncateAddress = (addr: string | null) => {
    if (!addr) return 'Not connected';
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  };

  const email = dbUser?.email || 'Loading...';
  const initials = email.substring(0, 2).toUpperCase();

  // 6. Currency logic
  const availableCurrencies = Object.keys(rates)
    .map((code) => ({ code, name: code, symbol: code }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const filteredCurrencies = searchQuery
    ? availableCurrencies.filter((c) =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableCurrencies;

  return (
    <Screen title="Settings" tabs={<FloatingTabBar />}>
      
      {/* Profile Card */}
      <Container
        onPress={onProfile}
        style={styles.profileCard}
      >
        <View style={styles.avatar}>
          {dbUser?.avatarUrl ? (
            <Image source={{ uri: dbUser.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{dbUser?.name || 'Loading...'}</Text>
          <Text style={styles.profileEmail}>{dbUser?.email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
      </Container>

      {/* Subscription Banner */}
      <Container style={styles.subCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Current Subscription</Text>
          <Text style={styles.subName}>
            {plan ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan` : 'No Active Plan'}
          </Text>
        </View>
        <View style={[styles.subBadge, status === 'active' ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.subBadgeText, { color: status === 'active' ? COLORS.up : COLORS.t2 }]}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </Container>

      <SectionHeader title="Account" />
      <Container flush>
        <ListRow icon="person-outline" title="Profile" chevron onPress={onProfile} iconColor={COLORS.accent} />
        <ListRow icon="wallet-outline" title="Wallet" subtitle={truncateAddress(walletAddress)} chevron onPress={onWallet} iconColor={COLORS.accent} />
        <ListRow
          icon="card-outline"
          title="Payment method"
          subtitle={loadingPortal ? 'Opening portal...' : 'Manage cards & billing'}
          chevron
          onPress={handleOpenBilling}
          iconColor={COLORS.accent}
          last
        />
      </Container>

      <SectionHeader title="App" />
      <Container flush>
        <ListRow icon="notifications-outline" title="Notifications" toggle={notif} onToggle={handleNotifToggle} iconColor={COLORS.accent} />
        <ListRow 
          icon="finger-print-outline" 
          title="Face ID / Fingerprint" 
          toggle={bio} 
          onToggle={handleBiometricToggle} 
          iconColor={COLORS.accent} 
          loading={loadingBio}
        />
        <ListRow
          icon="cash-outline"
          title="Currency"
          value={currency}
          chevron
          onPress={() => setShowCurrencyModal(true)}
          iconColor={COLORS.accent}
          last
        />
      </Container>

      <SectionHeader title="Company" />
      <Container flush>
        <ListRow icon="information-circle-outline" title="About NorthernAlley" chevron onPress={onAbout} iconColor={COLORS.accent} />
        <ListRow icon="document-text-outline" title="Policies" chevron onPress={onPolicies} iconColor={COLORS.accent} />
        <ListRow icon="help-circle-outline" title="Help & Support" chevron onPress={onSupport} iconColor={COLORS.accent} last />
      </Container>

      <View style={{ marginTop: 32 }}>
        <Button label="Sign Out" variant="danger" onPress={handleSignOut} />
      </View>

      <Text style={styles.version}>Version 1.0.0 (Production)</Text>

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
            <Ionicons name="search" size={20} color={COLORS.accent} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search currency..."
              placeholderTextColor={COLORS.accentText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>
          {ratesLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.accent} />
            </View>
          ) : (
            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item.code}
              contentContainerStyle={{ padding: SPACING.s3 }}
              renderItem={({ item }) => {
                const isActive = currency === item.code;
                const sampleFormat = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: item.code,
                }).format(rates[item.code] || 1);

                return (
                  <Pressable
                    style={[styles.currencyRow, isActive && styles.currencyRowActive]}
                    onPress={() => {
                      setCurrency(item.code);
                      setShowCurrencyModal(false);
                      setSearchQuery('');
                    }}
                  >
                    <View style={styles.currencyRowLeft}>
                      <Text style={[styles.currencySymbol, isActive && { color: COLORS.accent }]}>
                        {item.code}
                      </Text>
                      <View>
                        <Text style={[styles.currencyCode, isActive && { color: COLORS.accentText }]}>
                          {item.code}
                        </Text>
                        <Text style={styles.currencyName}>1 USD = {sampleFormat}</Text>
                      </View>
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={24} color={COLORS.accent} />}
                  </Pressable>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    marginBottom: 16, 
    padding: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  avatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: COLORS.accent, 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden' 
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 20 },
  profileName: { fontSize: 18, fontWeight: '700', color: COLORS.t1 },
  profileEmail: { fontSize: 13, color: COLORS.t2, marginTop: 2 },

  label: { fontSize: 13, color: COLORS.accentText, fontWeight: '600' },
  subCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  subName: { fontSize: 18, fontWeight: '700', color: COLORS.t1, marginTop: 4 },
  subBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeActive: { backgroundColor: COLORS.upSoft },
  badgeInactive: { backgroundColor: COLORS.soft },
  subBadgeText: { fontSize: 12, fontWeight: '700' },

  version: { textAlign: 'center', fontSize: 12, color: COLORS.t3, marginTop: SPACING.s3 },

  modalSafe: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.s3, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.t1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: SPACING.s3, paddingHorizontal: SPACING.s3, height: 48, borderRadius: RADIUS.lg, backgroundColor: COLORS.accentSoft },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.t1 },
  currencyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.s3, paddingHorizontal: SPACING.s3, borderRadius: RADIUS.md, marginBottom: 4, borderWidth: 1, borderColor: 'transparent' },
  currencyRowActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accentMedium },
  currencyRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  currencySymbol: { fontSize: 20, fontWeight: '700', color: COLORS.t1, width: 40, textAlign: 'center' },
  currencyCode: { fontSize: 16, fontWeight: '600', color: COLORS.t1 },
  currencyName: { fontSize: 13, color: COLORS.t2, marginTop: 2 },
});
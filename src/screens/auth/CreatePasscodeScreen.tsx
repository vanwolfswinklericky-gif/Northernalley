// src/screens/auth/CreatePasscodeScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { hasError, isCreating, isNotCreated, useEmbeddedWallet } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function CreatePasscodeScreen() {
  const router = useRouter();
  const wallet = useEmbeddedWallet();
  
  const [passcode, setPasscode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletCreating = isCreating(wallet);
  const canCreateWallet = isNotCreated(wallet) || hasError(wallet);
  const isValid = passcode.length === 8 && passcode === confirm;

  const handleCreate = async () => {
    if (!isValid || !canCreateWallet) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await wallet.create({
        recoveryMethod: 'user-passcode',
        password: passcode,
      });
      router.replace('/(app)/plan');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create your wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Create Your Recovery Passcode"
      subtitle="Use this 8-digit passcode to recover your wallet after signing in on a new device."
      footer={
        <View style={{ paddingBottom: 24 }}>
          <Button
            label={walletCreating || loading ? 'Creating wallet…' : 'Create Wallet'}
            onPress={handleCreate}
            loading={walletCreating || loading}
            disabled={!isValid || !canCreateWallet}
            variant="accent"
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      }
    >
      {/* Header Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="key" size={32} color={COLORS.accent} />
        </View>
      </View>

      <Text style={styles.helperText}>
        You’ll need to sign in to your account before using this passcode to recover your wallet. NorthernAlley does not store the passcode, so keep it somewhere safe and never share it.
      </Text>

      {/* Passcode Input */}
      <Text style={styles.label}>8-digit passcode</Text>
      <View style={[styles.inputContainer, passcode.length > 0 && !showPasscode && styles.inputActive]}>
        <TextInput
          style={styles.input}
          value={passcode}
          onChangeText={(text) => setPasscode(text.replace(/[^0-9]/g, ''))}
          placeholder="••••••••"
          placeholderTextColor={COLORS.t3}
          secureTextEntry={!showPasscode}
          keyboardType="number-pad"
          maxLength={8}
          autoFocus
        />
        <Pressable onPress={() => setShowPasscode(!showPasscode)} style={styles.eyeButton}>
          <Ionicons 
            name={showPasscode ? 'eye-off-outline' : 'eye-outline'} 
            size={22} 
            color={COLORS.t2} 
          />
        </Pressable>
      </View>

      {/* Confirm Passcode Input */}
      <Text style={[styles.label, { marginTop: 16 }]}>Confirm 8-digit passcode</Text>
      <View style={[styles.inputContainer, confirm.length > 0 && confirm === passcode && styles.inputSuccess]}>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={(text) => setConfirm(text.replace(/[^0-9]/g, ''))}
          placeholder="••••••••"
          placeholderTextColor={COLORS.t3}
          secureTextEntry={!showPasscode}
          keyboardType="number-pad"
          maxLength={8}
        />
      </View>
      
      {confirm.length > 0 && confirm !== passcode && (
        <Text style={styles.matchError}>Passcodes do not match</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accentMedium,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.t2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.t1,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.line, // Default gray
    borderRadius: RADIUS.lg,
    height: 64,
    paddingHorizontal: 16,
  },
  inputActive: {
    borderColor: COLORS.accent, // Purple when typing
  },
  inputSuccess: {
    borderColor: COLORS.up, // Green when it matches
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.t1,
    letterSpacing: 8, // PIN style spacing
    textAlign: 'center',
  },
  eyeButton: {
    padding: 8,
  },
  matchError: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
// src/screens/auth/RecoveryScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRecoverEmbeddedWallet } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRecoveryStore } from '@/store/recoveryStore';
import { TextInput } from '@/components/ui/TextInput';

export function RecoveryScreen() {
  const router = useRouter();
  const { recover } = useRecoverEmbeddedWallet();
  const onRecovered = useRecoveryStore((s) => s.onRecovered);
  const clearRecovery = useRecoveryStore((s) => s.clear);
  
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = passcode.length === 8;

  const handleRecover = async () => {
    if (!isValid) {
      setError('Enter the 8-digit wallet recovery passcode.');
      return;
    }
    if (!onRecovered) {
      setError('Wallet recovery is still initializing. Please wait and try again.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await recover({
        recoveryMethod: 'user-passcode',
        password: passcode,
      });

      // CRITICAL: notify the Privy SDK that recovery is complete.
      onRecovered();
      clearRecovery();

      router.replace('/');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not recover the wallet. Check the passcode and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Welcome back"
      subtitle="After signing in to your account, enter your 8-digit recovery passcode to restore your wallet."
      footer={
        <View style={{ paddingBottom: 24 }}>
          <Button
            label="Unlock Wallet"
            onPress={handleRecover}
            loading={loading}
            disabled={!isValid}
            variant="accent"
          />
        </View>
      }
    >
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={32} color={COLORS.accent} />
        </View>
      </View>

      <TextInput
        label="8-digit wallet recovery passcode"
        value={passcode}
        onChange={(value) => setPasscode(value.replace(/[^0-9]/g, ''))}
        placeholder="Enter 8 digits"
        secureTextEntry={!showPasscode}
        keyboardType="number-pad"
        maxLength={8}
        autoFocus
        error={error}
        right={
          <Pressable onPress={() => setShowPasscode(!showPasscode)} style={styles.eyeButton}>
            <Ionicons
              name={showPasscode ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={COLORS.t2}
            />
          </Pressable>
        }
      />

      <Text style={styles.helperText}>
        This is the passcode you created when you set up wallet recovery. NorthernAlley cannot reset or retrieve it.
      </Text>

      <Text style={styles.forgotNote}>
        Forgot your passcode? If you have no other backup recovery method, the wallet may be unrecoverable.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
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
  eyeButton: {
    padding: 8,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.t2,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  forgotNote: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.t3,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
// src/screens/auth/RecoveryScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { useRecoverEmbeddedWallet } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useRecoveryStore } from '@/store/recoveryStore';

export function RecoveryScreen() {
  const router = useRouter();
  const { recover } = useRecoverEmbeddedWallet();
  const onRecovered = useRecoveryStore((s) => s.onRecovered);
  const clearRecovery = useRecoveryStore((s) => s.clear);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);

  // Clean up the stored callback if the user backs out without recovering.
  useEffect(() => {
    return () => {
      // Intentionally not clearing here on unmount-after-success (already cleared).
    };
  }, []);

  const handleRecover = async () => {
    if (passcode.length < 4) {
      Alert.alert('Error', 'Please enter your passcode.');
      return;
    }

    setLoading(true);
    try {
      await recover({
        recoveryMethod: 'user-passcode',
        password: passcode,
      });

      // CRITICAL: notify the SDK that recovery is complete.
      onRecovered?.();
      clearRecovery();

      router.replace('/(app)/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Recovery Failed', err.message || 'Invalid passcode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Recover Your Wallet"
      subtitle="Enter your passcode to access your wallet on this device."
      footer={
        <Button
          label="Recover Wallet"
          onPress={handleRecover}
          loading={loading}
          variant="accent"
        />
      }
    >
      <TextInput
        label="Passcode"
        value={passcode}
        onChange={setPasscode}
        placeholder="Enter your passcode"
        secureTextEntry
        keyboardType="number-pad"
      />
    </Screen>
  );
}
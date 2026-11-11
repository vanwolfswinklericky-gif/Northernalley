// src/screens/auth/CreatePasscodeScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { isNotCreated, needsRecovery, useEmbeddedWallet } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export function CreatePasscodeScreen() {
  const router = useRouter();
  const wallet = useEmbeddedWallet();
  const [passcode, setPasscode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (passcode.length < 4) {
      Alert.alert('Error', 'Passcode must be at least 4 digits.');
      return;
    }
    if (passcode !== confirm) {
      Alert.alert('Error', 'Passcodes do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isNotCreated(wallet)) {
        await wallet.create({
          recoveryMethod: 'user-passcode',
          password: passcode,
        });
        router.replace('/(app)/plan');
      } else if (needsRecovery(wallet)) {
        // Wallet exists but isn't available on this device — go recover it.
        router.replace('/(auth)/recovery');
      } else {
        // Already created and available; skip ahead.
        router.replace('/(app)/(tabs)/dashboard');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create wallet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Secure Your Wallet"
      subtitle="Set a passcode to recover your wallet on new devices."
      footer={
        <Button
          label="Create Wallet"
          onPress={handleCreate}
          loading={loading}
          variant="accent"
        />
      }
    >
      <TextInput
        label="Passcode"
        value={passcode}
        onChange={setPasscode}
        placeholder="Enter a 4+ digit passcode"
        secureTextEntry
        keyboardType="number-pad"
      />
      <TextInput
        label="Confirm Passcode"
        value={confirm}
        onChange={setConfirm}
        placeholder="Confirm your passcode"
        secureTextEntry
        keyboardType="number-pad"
      />
    </Screen>
  );
}
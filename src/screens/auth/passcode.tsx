// src/app/(auth)/passcode.tsx
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useAuthStore } from '@/store/authStore';

const LOCAL_PIN_KEY = 'app_local_pin';

export default function PasscodeRoute() {
  const router = useRouter();
  const setLocked = useAuthStore((s) => s.setLocked);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const stored = await SecureStore.getItemAsync(LOCAL_PIN_KEY);
      if (stored && stored === passcode) {
        setLocked(false);
        router.replace('/(app)/(tabs)/dashboard');
      } else {
        Alert.alert('Error', 'Incorrect passcode.');
      }
    } catch {
      Alert.alert('Error', 'Could not verify passcode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="App Locked"
      subtitle="Enter your passcode to continue."
      footer={<Button label="Unlock" onPress={handleUnlock} loading={loading} variant="accent" />}
    >
      <TextInput label="Passcode" value={passcode} onChange={setPasscode} placeholder="Enter passcode" secureTextEntry keyboardType="number-pad" />
    </Screen>
  );
}
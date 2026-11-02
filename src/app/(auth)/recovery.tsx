import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { useRecoveryStore } from '@/store/recoveryStore';
import { useRecoverEmbeddedWallet } from '@privy-io/expo';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function RecoveryRoute() {
  const { recover } = useRecoverEmbeddedWallet();
  const onRecovered = useRecoveryStore((s) => s.onRecovered);
  const clearRecovery = useRecoveryStore((s) => s.clear);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecover = async () => {
    if (passcode.length < 4) return Alert.alert('Error', 'Please enter your passcode.');
    setLoading(true);
    try {
      await recover({ recoveryMethod: 'user-passcode', password: passcode });
      onRecovered?.(); // Critical: must call
      clearRecovery();
      // Do not navigate! RootNavigator will automatically switch after wallet state updates.
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
      footer={<Button label="Recover Wallet" onPress={handleRecover} loading={loading} variant="accent" />}
    >
      <TextInput label="Passcode" value={passcode} onChange={setPasscode} placeholder="Enter your passcode" secureTextEntry keyboardType="number-pad" />
    </Screen>
  );
}
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS } from '@/constants/theme';
import { useSetEmbeddedWalletRecovery } from '@privy-io/expo';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RecoveryPasscodeScreenProps {
  onBack: () => void;
}

export function RecoveryPasscodeScreen({ onBack }: RecoveryPasscodeScreenProps) {
  const { setRecovery } = useSetEmbeddedWalletRecovery();
  const [passcode, setPasscode] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = passcode.length === 8 && passcode === confirmation;

  const savePasscode = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const result = await setRecovery({
        recoveryMethod: 'user-passcode',
        password: passcode,
      });
      if (!result.user) {
        throw new Error('Recovery setup did not complete. Please try again.');
      }

      onBack();
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save your recovery passcode. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen
      onBack={onBack}
      title="Wallet Recovery Passcode"
      subtitle="Set or change the passcode used to recover your wallet on a new device."
      footer={
        <View style={styles.footer}>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            label="Save recovery passcode"
            onPress={savePasscode}
            loading={isSaving}
            disabled={!isValid}
          />
        </View>
      }
    >
      <Container style={styles.card}>
        <Text style={styles.note}>
          You must sign in to your NorthernAlley account before using this passcode to recover your
          wallet. NorthernAlley does not store it. Choose a code you can keep safe, and never share it.
        </Text>
      </Container>

      <TextInput
        label="New 8-digit passcode"
        value={passcode}
        onChange={(value) => setPasscode(value.replace(/[^0-9]/g, ''))}
        placeholder="Enter 8 digits"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
        autoFocus
      />
      <TextInput
        label="Confirm passcode"
        value={confirmation}
        onChange={(value) => setConfirmation(value.replace(/[^0-9]/g, ''))}
        placeholder="Re-enter 8 digits"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
      />
      {confirmation.length > 0 && confirmation !== passcode && (
        <Text style={styles.error}>Passcodes do not match.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 24,
  },
  note: {
    color: COLORS.t2,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  error: {
    color: COLORS.danger,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
});

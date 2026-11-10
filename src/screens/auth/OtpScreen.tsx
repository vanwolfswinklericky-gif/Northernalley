// src/screens/auth/OtpScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { isNotCreated, useEmbeddedWallet, useLoginWithEmail } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function OtpScreen({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const email = usePlanStore((s) => s.email);
  const wallet = useEmbeddedWallet();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginWithCode } = useLoginWithEmail({
    onLoginSuccess: async () => {
      // Create embedded wallet after successful email OTP login
      if (isNotCreated(wallet)) {
        try {
          await wallet.create({ recoveryMethod: 'privy' });
        } catch (err) {
          console.error('Wallet creation failed:', err);
          // Non-blocking: user is still logged in even if wallet creation fails
        }
      }
    },
  });

  const handleVerify = async () => {
    if (code.length < 6) return;

    setLoading(true);
    setError(null);

    try {
      await loginWithCode({ code, email });
      router.replace('/(auth)/plan');
    } catch (err: any) {
      console.log('REAL PRIVY OTP ERROR:', JSON.stringify(err, null, 2));
      setError('Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      onBack={onBack}
      progress={3 / 10}
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to ${email}`}
      footer={
        <View style={{ paddingBottom: 40 }}>
          <Button
            label="Verify Code"
            disabled={code.length < 6}
            loading={loading}
            onPress={handleVerify}
          />
        </View>
      }
    >
      <TextInput
        label="Verification Code"
        value={code}
        onChange={setCode}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.downSoft,
    borderRadius: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    flex: 1,
  },
});
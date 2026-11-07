// src/screens/auth/OtpScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { useLoginWithEmail } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function OtpScreen({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const email = usePlanStore((s) => s.email);
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginWithCode } = useLoginWithEmail();

  const handleVerify = async () => {
    if (code.length < 6) return;
    
    setLoading(true);
    setError(null);

    try {
      // Privy checks if the code is correct.
      await loginWithCode({ code, email });
      
      // If successful, the user is logged in. Proceed to Plan.
      router.replace('/(auth)/plan');
      
    } catch (err: any) {
      // Log the real error so we can see it in Metro
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
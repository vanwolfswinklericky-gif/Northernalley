// src/screens/auth/CreateAccountScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { useLoginWithEmail } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export function CreateAccountScreen({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const email = usePlanStore((s) => s.email);
  
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Privy Hook
  const { sendCode } = useLoginWithEmail();

  const checks: [string, boolean][] = [
    ['8+ characters', password.length >= 8],
    ['A number', /\d/.test(password)],
    ['An uppercase letter', /[A-Z]/.test(password)],
  ];
  const allChecks = checks.every((c) => c[1]);
  const match = password.length > 0 && password === confirm;
  const valid = allChecks && match;

  const handleCreateAccount = async () => {
    if (!email) {
      Alert.alert('Error', 'Email is missing. Please go back.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Privy sends the 6-digit verification code to the user's email
      await sendCode({ email });
      
      // Move to the OTP verification screen instead of the Plan screen
      router.replace('/(auth)/verify-otp');
      
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const eye = (
    <Pressable onPress={() => setShow(!show)} hitSlop={8}>
      <Ionicons 
        name={show ? 'eye-off-outline' : 'eye-outline'} 
        size={20} 
        color={COLORS.t3} 
      />
    </Pressable>
  );

  return (
    <Screen
      onBack={onBack}
      progress={2 / 10}
      title="Create a password"
      subtitle={`For ${email}`}
      footer={
        <View style={styles.footer}>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button
            label="Create Account"
            disabled={!valid}
            loading={loading}
            onPress={handleCreateAccount}
          />
        </View>
      }
    >
      <TextInput
        label="Password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        secureTextEntry={!show}
        right={eye}
      />
      
      <TextInput
        label="Confirm password"
        value={confirm}
        onChange={setConfirm}
        placeholder="••••••••"
        secureTextEntry={!show}
        error={confirm && confirm !== password ? "Passwords don't match" : null}
      />

      <View style={styles.checks}>
        {checks.map(([label, on]) => (
          <View key={label} style={styles.checkRow}>
            <Ionicons
              name={on ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={on ? COLORS.accent : COLORS.t3}
            />
            <Text style={[styles.checkText, { color: on ? COLORS.t1 : COLORS.t3 }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingBottom: 40,
  },
  checks: {
    gap: 10,
    marginTop: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    fontSize: 14,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
});
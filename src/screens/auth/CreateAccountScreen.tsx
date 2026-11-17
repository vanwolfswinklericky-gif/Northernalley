// src/screens/auth/CreateAccountScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { useLoginWithEmail } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function CreateAccountScreen({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const email = usePlanStore((s) => s.email);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sendCode } = useLoginWithEmail();

  const checks: [string, boolean][] = [
    ['At least 8 characters', password.length >= 8],
    ['Contains a number', /\d/.test(password)],
    ['Contains an uppercase letter', /[A-Z]/.test(password)],
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
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/register-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || 'Failed to create account.');
        return;
      }

      await sendCode({ email });
      router.replace({ pathname: '/(auth)/verify-otp', params: { flow: 'signup' } });
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

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
      {/* Header Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={32} color={COLORS.accent} />
        </View>
      </View>

      {/* Password Input */}
      <Text style={styles.label}>Password</Text>
      <View style={[styles.inputContainer, password.length > 0 && !allChecks && styles.inputErrorBorder]}>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Create a strong password"
          placeholderTextColor={COLORS.t3}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={() => setShow(!show)} hitSlop={12} style={styles.eyeBtn}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={22} color={COLORS.t3} />
        </Pressable>
      </View>

      {/* Confirm Password Input */}
      <Text style={[styles.label, { marginTop: 16 }]}>Confirm Password</Text>
      <View style={[styles.inputContainer, confirm.length > 0 && !match && styles.inputErrorBorder]}>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm your password"
          placeholderTextColor={COLORS.t3}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {confirm.length > 0 && !match && (
        <Text style={styles.matchError}>Passwords do not match</Text>
      )}

      {/* Password Strength Checks */}
      <View style={styles.checksBox}>
        <Text style={styles.checksTitle}>Password requirements</Text>
        {checks.map(([label, on]) => (
          <View key={label} style={styles.checkRow}>
            <Ionicons
              name={on ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={on ? COLORS.up : COLORS.t3} // Green when valid, gray when not
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
    paddingBottom: 24 
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginBottom: 12,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accentMedium,
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
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    height: 56,
    paddingHorizontal: 16,
  },
  inputErrorBorder: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.t1,
    height: '100%',
  },
  eyeBtn: {
    padding: 8,
  },
  matchError: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 8,
    marginLeft: 4,
  },
  checksBox: {
    backgroundColor: COLORS.accentSoft,
    padding: 16,
    borderRadius: RADIUS.lg,
    marginTop: 24,
    gap: 12,
  },
  checksTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentText,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
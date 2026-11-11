// src/screens/auth/EmailScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { useLoginWithEmail, useLoginWithOAuth } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function EmailScreen() {
  const router = useRouter();
  const setEmail = usePlanStore((s) => s.setEmail);

  const [email, setLocalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { sendCode } = useLoginWithEmail();

  const { login: loginWithGoogle } = useLoginWithOAuth({
    onSuccess: () => router.replace('/(app)/(tabs)/dashboard'),
    onError: (err) => {
      setError(err.message || 'Google sign in failed');
      setGoogleLoading(false);
    },
  });

  // Verify password against your backend, then trigger Privy OTP
  const handleEmailLogin = async () => {
    if (!EMAIL_RE.test(email)) return;
    if (password.length === 0) {
      setError('Please enter your password.');
      return;
    }

    setEmailLoading(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (res.status === 401) {
        setError('Incorrect email or password.');
        return;
      }
      if (!res.ok) {
        setError('Something went wrong. Please try again.');
        return;
      }

      // Password OK → let Privy send the OTP
      setEmail(normalizedEmail);
      await sendCode({ email: normalizedEmail });

      router.push({ pathname: '/(auth)/verify-otp', params: { flow: 'login' } });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    loginWithGoogle({ provider: 'google' });
  };

  return (
    <Screen
      onBack={() => router.back()}
      progress={1 / 10}
      title="Sign in"
      subtitle="Enter your email and password to continue."
      footer={
        <View style={styles.footer}>
          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            label="Continue"
            disabled={!EMAIL_RE.test(email) || password.length === 0 || googleLoading}
            loading={emailLoading}
            onPress={handleEmailLogin}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>

          <Pressable
            onPress={handleGoogleLogin}
            disabled={emailLoading || googleLoading}
            style={({ pressed }) => [
              styles.googleBtn,
              pressed && { opacity: 0.8 },
              (emailLoading || googleLoading) && { opacity: 0.6 },
            ]}
          >
            {googleLoading ? (
              <ActivityIndicator color={COLORS.t1} />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://developers.google.com/static/identity/images/g-logo.png' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/create-account')}
            style={{ marginTop: 16, alignItems: 'center' }}
          >
            <Text style={{ color: COLORS.t3, fontSize: 13 }}>New here? Create an account</Text>
          </Pressable>
        </View>
      }
    >
      <TextInput
        label="Email"
        value={email}
        onChange={setLocalEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoFocus
      />
      <TextInput
        label="Password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        secureTextEntry
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { paddingBottom: 40, gap: 16 },
  errorText: { color: COLORS.danger, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.line },
  dividerText: { fontSize: 13, color: COLORS.t3, fontWeight: '500' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: 999, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: COLORS.line, gap: 12,
  },
  googleIcon: { width: 22, height: 22 },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.t1 },
});
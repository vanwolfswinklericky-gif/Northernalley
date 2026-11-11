// src/screens/auth/EmailScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

export function EmailScreen() {
  const router = useRouter();
  const setEmail = usePlanStore((s) => s.setEmail);
  const { user } = usePrivy(); // Needed to get the ID right after Google login

  const [email, setLocalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<'email' | 'password'>('email');
  const [checking, setChecking] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { sendCode } = useLoginWithEmail();

  const { login: loginWithGoogle } = useLoginWithOAuth({
    onSuccess: async () => {
      // 1. Give Privy a moment to populate the `user` object
      setTimeout(async () => {
        if (!user?.id) {
          setError('Google login failed. User object not found.');
          setGoogleLoading(false);
          return;
        }

        try {
          // 2. Sync with your backend to determine if this is a new or existing user
          const res = await fetch(`${API_URL}/auth/sync-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              privyUserId: user.id,
              email: (user as any).email?.address || null,
            }),
          });

          const data = await res.json();

          // 3. Route based on whether they are new
          if (data.isNewUser) {
            router.replace('/(auth)/plan'); // New user -> onboarding
          } else {
            router.replace('/(app)/(tabs)/dashboard'); // Existing user -> dashboard
          }
        } catch (err) {
          // Fallback: If backend fails, just send them to dashboard
          console.error('Google sync failed:', err);
          router.replace('/(app)/(tabs)/dashboard');
        } finally {
          setGoogleLoading(false);
        }
      }, 800); // 800ms delay to let Privy hydrate the `user` hook
    },
    onError: (err) => {
      setError(err.message || 'Google sign in failed');
      setGoogleLoading(false);
    },
  });

  // Step 1: check if user exists
  const handleEmailContinue = async () => {
    if (!EMAIL_RE.test(email)) return;
    setChecking(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const res = await fetch(`${API_URL}/auth/check-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json();

      if (data.exists) {
        // Returning user → show password
        setLocalEmail(normalizedEmail);
        setStep('password');
      } else {
        // New user → go to create account
        setEmail(normalizedEmail);
        router.push('/(auth)/create-account');
      }
    } catch (err: any) {
      setError('Could not check email. Try again.');
    } finally {
      setChecking(false);
    }
  };

  // Step 2: verify password for returning user
  const handlePasswordSubmit = async () => {
    if (password.length === 0) {
      setError('Please enter your password.');
      return;
    }

    setEmailLoading(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const res = await fetch(`${API_URL}/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (res.status === 401) {
        setError('Incorrect password.');
        return;
      }
      if (!res.ok) {
        setError('Something went wrong. Please try again.');
        return;
      }

      setEmail(normalizedEmail);
      await sendCode({ email: normalizedEmail });
      router.push({ pathname: '/(auth)/verify-otp', params: { flow: 'login' } });
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
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
      onBack={() => (step === 'password' ? setStep('email') : router.back())}
      progress={1 / 10}
      title={step === 'email' ? 'Sign in' : 'Enter your password'}
      subtitle={step === 'email' ? 'Enter your email to continue.' : `Welcome back, ${email}`}
      footer={
        <View style={styles.footer}>
          {error && <Text style={styles.errorText}>{error}</Text>}

          {step === 'email' ? (
            <Button
              label="Continue"
              disabled={!EMAIL_RE.test(email) || googleLoading}
              loading={checking}
              onPress={handleEmailContinue}
            />
          ) : (
            <Button
              label="Sign In"
              disabled={password.length === 0}
              loading={emailLoading}
              onPress={handlePasswordSubmit}
            />
          )}

          {step === 'email' && (
            <>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.line} />
              </View>

              <Pressable
                onPress={handleGoogleLogin}
                disabled={checking || googleLoading}
                style={({ pressed }) => [
                  styles.googleBtn,
                  pressed && { opacity: 0.8 },
                  (checking || googleLoading) && { opacity: 0.6 },
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
            </>
          )}
        </View>
      }
    >
      {step === 'email' ? (
        <TextInput
          label="Email"
          value={email}
          onChange={setLocalEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />
      ) : (
        <TextInput
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoFocus
        />
      )}
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
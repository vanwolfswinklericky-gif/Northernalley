// src/screens/auth/EmailScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

export function EmailScreen() {
  const router = useRouter();
  const setEmail = usePlanStore((s) => s.setEmail);
  const { user } = usePrivy();

  const [email, setLocalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<'email' | 'password'>('email');
  const [checking, setChecking] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAuthReady, setGoogleAuthReady] = useState(false);

  const { sendCode } = useLoginWithEmail();

  const { login: loginWithGoogle } = useLoginWithOAuth({
    onSuccess: () => setGoogleAuthReady(true),
    onError: (err) => {
      setError(err.message || 'Google sign in failed');
      setGoogleLoading(false);
    },
  });

  useEffect(() => {
    if (!googleAuthReady || !user?.id) return;

    let active = true;
    const syncGoogleUser = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/sync-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            privyUserId: user.id,
            email: (user as any).email?.address || null,
          }),
        });
        if (!res.ok) throw new Error(`Account sync failed (HTTP ${res.status}).`);

        const data = await res.json();
        if (active) {
          router.replace(
            data.isNewUser ? '/(app)/plan' : '/(app)/(tabs)/dashboard',
          );
        }
      } catch (error) {
        if (active) {
          console.error('Google account sync failed:', error);
          Alert.alert(
            'Account sync failed',
            'Your sign-in succeeded, but account setup could not finish. Please try again.',
          );
          router.replace('/(app)/(tabs)/dashboard');
        }
      } finally {
        if (active) {
          setGoogleLoading(false);
          setGoogleAuthReady(false);
        }
      }
    };

    syncGoogleUser();
    return () => {
      active = false;
    };
  }, [googleAuthReady, user, router]);

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
      if (!res.ok) throw new Error(`Email lookup failed (HTTP ${res.status}).`);

      const data = await res.json();

      if (data.exists) {
        setLocalEmail(normalizedEmail);
        setStep('password');
      } else {
        setEmail(normalizedEmail);
        router.push('/(auth)/create-account');
      }
    } catch {
      setError('Could not check email. Try again.');
    } finally {
      setChecking(false);
    }
  };

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
      title={step === 'email' ? 'Welcome to NorthernAlley' : 'Welcome back'}
      subtitle={step === 'email' ? 'Sign in or create an account to continue.' : `Enter your password for ${email}`}
      footer={
        <View style={styles.footer}>
          {error && <Text style={styles.errorText}>{error}</Text>}

          {step === 'email' ? (
            <Button
              label="Continue"
              disabled={!EMAIL_RE.test(email) || googleLoading}
              loading={checking}
              onPress={handleEmailContinue}
              variant="accent"
            />
          ) : (
            <Button
              label="Sign In"
              disabled={password.length === 0}
              loading={emailLoading}
              onPress={handlePasswordSubmit}
              variant="accent"
            />
          )}

          {step === 'email' && (
            <>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>OR</Text>
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
            </>
          )}
        </View>
      }
    >
      {step === 'email' ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email address</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color={COLORS.t3} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setLocalEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.t3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
          </View>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.t3} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.t3}
              secureTextEntry={!showPassword}
              autoFocus
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color={COLORS.t3} 
              />
            </Pressable>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { 
    paddingBottom: 40, 
    gap: 16 
  },
  errorText: { 
    color: COLORS.danger, 
    fontSize: 13, 
    textAlign: 'center', 
    fontWeight: '600',
    marginBottom: 8 
  },
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginVertical: 8 
  },
  line: { 
    flex: 1, 
    height: 1, 
    backgroundColor: COLORS.line 
  },
  dividerText: { 
    fontSize: 12, 
    color: COLORS.t3, 
    fontWeight: '600',
    letterSpacing: 1
  },
  googleBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    height: 56, 
    borderRadius: RADIUS.full, 
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, 
    borderColor: COLORS.line, 
    gap: 12,
  },
  googleIcon: { 
    width: 24, 
    height: 24 
  },
  googleBtnText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.t1 
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.t1,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    height: 60,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.t1,
    height: '100%',
  },
});
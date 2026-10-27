// src/screens/auth/EmailScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS, SPACING } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { useLoginWithOAuth, usePrivy } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// 1. ADD THIS INTERFACE
interface EmailScreenProps {
  onBack: () => void;
}

// 2. ACCEPT onBack IN THE COMPONENT
export function EmailScreen({ onBack }: EmailScreenProps) {
  const router = useRouter();
  const setEmail = usePlanStore((s) => s.setEmail);
  const { isReady, user } = usePrivy();

  const [email, setLocalEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // If already logged in, bypass this screen
  if (isReady && user) {
    router.replace('/(auth)/plan');
    return null;
  }

  const { login: loginWithGoogle } = useLoginWithOAuth({
    onSuccess: () => {
      router.replace('/(auth)/plan');
    },
    onError: (err) => {
      setError(err.message || 'Google sign in failed');
      setGoogleLoading(false);
    },
  });

  const handleContinue = () => {
    if (!EMAIL_RE.test(email)) return;
    
    setEmailLoading(true);
    setEmail(email.trim().toLowerCase());
    router.push('/(auth)/create-account');
    
    setTimeout(() => setEmailLoading(false), 1000);
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    loginWithGoogle({ provider: 'google' });
  };

  return (
    <Screen
      onBack={onBack} // 3. USE THE PROP HERE
      progress={1 / 10}
      title="Welcome"
      subtitle="Create an account or sign in to continue."
      footer={
        <View style={styles.footer}>
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          <Button
            label="Continue with Email"
            disabled={!EMAIL_RE.test(email) || googleLoading}
            loading={emailLoading}
            onPress={handleContinue}
          />
        </View>
      }
    >
      {/* 1. Google Button */}
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

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>or use email</Text>
        <View style={styles.line} />
      </View>

      {/* 2. Email Input */}
      <TextInput
        label="Email"
        value={email}
        onChange={setLocalEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingBottom: 40,
    gap: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.line,
    gap: 12,
    marginBottom: SPACING.lg,
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.t1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.line,
  },
  dividerText: {
    fontSize: 13,
    color: COLORS.t3,
    fontWeight: '500',
  },
});
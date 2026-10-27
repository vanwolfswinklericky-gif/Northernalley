// src/screens/auth/LoginScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLoginWithOAuth } from '@privy-io/expo';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface LoginScreenProps {
  onBack: () => void;
  onContinue: () => void;
  onGoogleSuccess: () => void;
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function LoginScreen({
  onBack,
  onContinue,
  onGoogleSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const valid = EMAIL_RE.test(email) && password.length >= 8;

  const { login } = useLoginWithOAuth({
    onSuccess: () => {
      onGoogleSuccess();
    },
    onError: (error) => {
      console.warn('Google login failed:', error);
    },
  });

  return (
    <Screen
      onBack={onBack}
      title="Welcome back"
      subtitle="Sign in to continue to your portfolio."
      footer={
        <>
          <Button label="Sign In" disabled={!valid} onPress={onContinue} />
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>
          <Button
            label="Continue with Google"
            variant="secondary"
            icon="logo-google"
            onPress={() => login({ provider: 'google' })}
          />
        </>
      }
    >
      <TextInput
        label="Email"
        value={email}
        onChange={setEmail}
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
        secureTextEntry={!show}
        right={
          <Pressable onPress={() => setShow(!show)} hitSlop={8}>
            <Ionicons
              name={show ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.t3}
            />
          </Pressable>
        }
      />
      <Pressable onPress={() => {}} style={styles.forgot}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end', marginTop: -8 },
  forgotText: { fontSize: 14, color: COLORS.t2, fontWeight: '500' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  line: { flex: 1, height: 1, backgroundColor: COLORS.line },
  dividerText: { fontSize: 13, color: COLORS.t3, fontWeight: '500' },
});
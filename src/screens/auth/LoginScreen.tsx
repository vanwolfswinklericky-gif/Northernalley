// src/screens/auth/LoginScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLoginWithOAuth } from '@privy-io/expo';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

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
  
  // 1. Loading states
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const valid = EMAIL_RE.test(email) && password.length >= 8;

  const { login } = useLoginWithOAuth({
    onSuccess: () => {
      onGoogleSuccess();
    },
    onError: (error) => {
      console.warn('Google login failed:', error);
      setGoogleLoading(false); // Reset loading on error
    },
  });

  const handleEmailLogin = () => {
    if (!valid) return;
    setEmailLoading(true);
    onContinue();
    setTimeout(() => setEmailLoading(false), 1000);
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    login({ provider: 'google' });
  };

  return (
    <Screen
      onBack={onBack}
      title="Welcome back"
      subtitle="Sign in to continue to your portfolio."
      footer={
        <View style={styles.footer}>
          <Button 
            label="Sign In" 
            disabled={!valid || googleLoading} 
            loading={emailLoading}
            onPress={handleEmailLogin} 
          />
          
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>

          {/* 2. Fixed Google Button with real logo */}
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
        </View>
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
  footer: { paddingBottom: 40, gap: 16 },
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
});
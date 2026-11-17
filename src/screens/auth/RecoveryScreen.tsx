// src/screens/auth/RecoveryScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRecoverEmbeddedWallet } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, TextInput as RNTextInput, StyleSheet, Text, View } from 'react-native';

import { useRecoveryStore } from '@/store/recoveryStore';

export function RecoveryScreen() {
  const router = useRouter();
  const { recover } = useRecoverEmbeddedWallet();
  const onRecovered = useRecoveryStore((s) => s.onRecovered);
  const clearRecovery = useRecoveryStore((s) => s.clear);
  
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = passcode.length >= 4;

  const handleRecover = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      await recover({
        recoveryMethod: 'user-passcode',
        password: passcode,
      });

      // CRITICAL: notify the Privy SDK that recovery is complete.
      onRecovered?.();
      clearRecovery();

      router.replace('/(app)/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Recovery Failed', err.message || 'Invalid passcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Welcome back"
      subtitle="Enter your security passcode to unlock your wallet on this device."
      footer={
        <View style={{ paddingBottom: 24 }}>
          <Button
            label="Unlock Wallet"
            onPress={handleRecover}
            loading={loading}
            disabled={!isValid}
            variant="accent"
          />
        </View>
      }
    >
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={32} color={COLORS.accent} />
        </View>
      </View>

      <Text style={styles.label}>Security Passcode</Text>
      
      <View style={styles.inputContainer}>
        <RNTextInput
          style={styles.input}
          value={passcode}
          onChangeText={(text) => setPasscode(text.replace(/[^0-9]/g, ''))} // Only numbers
          placeholder="••••"
          placeholderTextColor={COLORS.t3}
          secureTextEntry={!showPasscode}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
        <Pressable onPress={() => setShowPasscode(!showPasscode)} style={styles.eyeButton}>
          <Ionicons 
            name={showPasscode ? 'eye-off-outline' : 'eye-outline'} 
            size={22} 
            color={COLORS.t2} 
          />
        </Pressable>
      </View>

      <Text style={styles.helperText}>
        This is the 4-6 digit passcode you created when you first set up your wallet.
      </Text>

      <Pressable style={styles.forgotLink} onPress={() => Alert.alert('Support', 'Please contact support to reset your wallet.')}>
        <Text style={styles.forgotText}>Forgot your passcode?</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accentMedium,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.t1,
    marginBottom: 8,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.accent, // Highlighted purple border
    borderRadius: RADIUS.lg,
    height: 64,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.t1,
    letterSpacing: 8, // Spaced out for a PIN feel
    textAlign: 'center',
  },
  eyeButton: {
    padding: 8,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.t2,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  forgotLink: {
    alignSelf: 'center',
    marginTop: 24,
    padding: 8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
});
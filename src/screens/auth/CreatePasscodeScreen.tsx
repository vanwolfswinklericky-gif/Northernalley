// src/screens/auth/CreatePasscodeScreen.tsx

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { isNotCreated, needsRecovery, useEmbeddedWallet } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function CreatePasscodeScreen() {
  const router = useRouter();
  const wallet = useEmbeddedWallet();
  
  const [passcode, setPasscode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = passcode.length >= 4 && passcode === confirm;

  const handleCreate = async () => {
    if (passcode.length < 4) {
      Alert.alert('Error', 'Passcode must be at least 4 digits.');
      return;
    }
    if (passcode !== confirm) {
      Alert.alert('Error', 'Passcodes do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isNotCreated(wallet)) {
        await wallet.create({
          recoveryMethod: 'user-passcode',
          password: passcode,
        });
        // NEW: Route to dashboard so they can choose a plan from the upgrade banner
        router.replace('/(app)/(tabs)/dashboard'); 
      } else if (needsRecovery(wallet)) {
        router.replace('/(auth)/recovery');
      } else {
        router.replace('/(app)/(tabs)/dashboard');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create wallet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Secure Your Wallet"
      subtitle="Set a passcode to recover your wallet on new devices."
      footer={
        <View style={{ paddingBottom: 24 }}>
          <Button
            label="Create Wallet"
            onPress={handleCreate}
            loading={loading}
            disabled={!isValid}
            variant="accent"
          />
        </View>
      }
    >
      {/* Header Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="key" size={32} color={COLORS.accent} />
        </View>
      </View>

      <Text style={styles.helperText}>
        This 4-digit passcode encrypts your wallet. If you lose your phone, this is the only way to recover your funds. <Text style={{fontWeight: '700', color: COLORS.t1}}>Do not forget it.</Text>
      </Text>

      {/* Passcode Input */}
      <Text style={styles.label}>Passcode</Text>
      <View style={[styles.inputContainer, passcode.length > 0 && !showPasscode && styles.inputActive]}>
        <TextInput
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

      {/* Confirm Passcode Input */}
      <Text style={[styles.label, { marginTop: 16 }]}>Confirm Passcode</Text>
      <View style={[styles.inputContainer, confirm.length > 0 && confirm === passcode && styles.inputSuccess]}>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={(text) => setConfirm(text.replace(/[^0-9]/g, ''))}
          placeholder="••••"
          placeholderTextColor={COLORS.t3}
          secureTextEntry={!showPasscode}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>
      
      {confirm.length > 0 && confirm !== passcode && (
        <Text style={styles.matchError}>Passcodes do not match</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
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
  helperText: {
    fontSize: 13,
    color: COLORS.t2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
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
    borderWidth: 2,
    borderColor: COLORS.line, // Default gray
    borderRadius: RADIUS.lg,
    height: 64,
    paddingHorizontal: 16,
  },
  inputActive: {
    borderColor: COLORS.accent, // Purple when typing
  },
  inputSuccess: {
    borderColor: COLORS.up, // Green when it matches
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.t1,
    letterSpacing: 8, // PIN style spacing
    textAlign: 'center',
  },
  eyeButton: {
    padding: 8,
  },
  matchError: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
});
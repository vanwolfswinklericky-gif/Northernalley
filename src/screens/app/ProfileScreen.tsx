// src/screens/app/ProfileScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProfileScreenProps {
  onBack: () => void;
  onSignOut: () => void;
}

export function ProfileScreen({ onBack, onSignOut }: ProfileScreenProps) {
  const [form, setForm] = useState({
    name: 'Jane Appleseed',
    email: 'jane@example.com',
    phone: '+1 (415) 555-0132',
  });
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  return (
    <Screen
      onBack={onBack}
      title="Profile"
      footer={
        <Button
          label="Save"
          onPress={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 1600);
          }}
        />
      }
    >
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JA</Text>
          <View style={styles.camera}>
            <Ionicons name="camera-outline" size={16} color={COLORS.t1} />
          </View>
        </View>
      </View>

      <Container>
        <TextInput label="Full name" value={form.name} onChange={set('name')} autoCapitalize="words" />
        <TextInput
          label="Email"
          value={form.email}
          onChange={set('email')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={{ marginBottom: -24 }}>
          <TextInput label="Phone" value={form.phone} onChange={set('phone')} keyboardType="phone-pad" />
        </View>
      </Container>

      <Container style={{ marginTop: SPACING.s5, padding: 20 }}>
        {!confirmDelete ? (
          <Button
            label="Delete Account"
            variant="danger"
            onPress={() => setConfirmDelete(true)}
          />
        ) : (
          <View>
            <Text style={styles.deleteTitle}>Delete your account?</Text>
            <Text style={styles.deleteBody}>
              Your recurring plan will be cancelled. Withdraw your balances first — this
              can't be undone.
            </Text>
            <View style={styles.deleteRow}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  small
                  onPress={() => setConfirmDelete(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Delete"
                  small
                  style={{ backgroundColor: COLORS.danger }}
                  onPress={onSignOut}
                />
              </View>
            </View>
          </View>
        )}
      </Container>

      {saved && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
          <Text style={styles.toastText}>Profile saved</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { alignItems: 'center', marginBottom: SPACING.s5 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.t1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '600' },
  camera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  deleteTitle: { fontSize: 15, fontWeight: '600', color: COLORS.t1, marginBottom: 6 },
  deleteBody: { fontSize: 14, color: COLORS.t2, lineHeight: 20, marginBottom: 16 },
  deleteRow: { flexDirection: 'row', gap: 8 },
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: COLORS.t1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
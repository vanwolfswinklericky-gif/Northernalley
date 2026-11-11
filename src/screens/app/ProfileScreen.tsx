// src/screens/app/ProfileScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/expo';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

export function ProfileScreen({ onBack, onSignOut }: any) {
  const { user, logout } = usePrivy();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/me?privyUserId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setName(data.user?.name || '');
        setAvatarUrl(data.user?.avatarUrl || null);
        // Auto-fill email from Privy if DB is empty
        setEmail(data.user?.email || (user as any).email?.address || '');
      })
      .catch(console.error);
  }, [user?.id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0].uri) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
      const res = await fetch(`${API_URL}/api/upload-avatar`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setAvatarUrl(data.url);
      else throw new Error('Upload failed');
    } catch (err) {
      Alert.alert('Error', 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyUserId: user.id, email, name, avatarUrl }),
      });
      Alert.alert('Success', 'Profile updated successfully.');
      onBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
              await fetch(`${API_URL}/api/delete-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ privyUserId: user.id }),
              });
              await logout();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete account.');
              setLoading(false);
            }
          } 
        },
      ]
    );
  };

  return (
    <Screen
      onBack={onBack}
      title="Profile"
      footer={<Button label="Save Changes" loading={loading} onPress={handleSave} />}
    >
      <View style={styles.avatarWrap}>
        <Pressable onPress={pickImage} style={styles.avatar} disabled={uploading}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{name ? name.substring(0, 2).toUpperCase() : 'U'}</Text>
          )}
          <View style={styles.camera}>
            {uploading ? <ActivityIndicator size="small" color={COLORS.accent} /> : <Ionicons name="camera-outline" size={18} color={COLORS.accent} />}
          </View>
        </Pressable>
      </View>

      <Container>
        <View style={{ marginBottom: SPACING.md }}>
          <TextInput label="Full Name" value={name} onChange={setName} placeholder="John Doe" autoCapitalize="words" />
        </View>
        <View>
          <TextInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" editable={false} />
        </View>
      </Container>

      {/* Danger Zone */}
      <Container style={styles.dangerZone}>
        <View style={styles.dangerHeader}>
          <Ionicons name="warning-outline" size={20} color={COLORS.danger} />
          <Text style={styles.dangerTitle}>Danger Zone</Text>
        </View>
        <Text style={styles.dangerText}>
          Once you delete your account, there is no going back. Please be certain.
        </Text>
        <Button label="Delete Account" variant="danger" loading={loading} onPress={handleDeleteAccount} />
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { alignItems: 'center', marginBottom: SPACING.s5 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', overflow: 'visible', borderWidth: 3, borderColor: COLORS.accentMedium },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '600' },
  camera: { position: 'absolute', right: 0, bottom: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
  dangerZone: { marginTop: SPACING.s5, padding: 20, backgroundColor: COLORS.downSoft, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#FCA5A5' },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dangerTitle: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
  dangerText: { color: COLORS.danger, fontSize: 13, marginBottom: 16, lineHeight: 18, opacity: 0.8 },
});
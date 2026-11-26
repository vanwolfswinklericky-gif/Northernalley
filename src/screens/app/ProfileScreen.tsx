// src/screens/app/ProfileScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/expo';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
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

  // --- LIVE DATA FETCH ---
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/me?privyUserId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setName(data.user?.name || '');
        setAvatarUrl(data.user?.avatarUrl || null);
        setEmail(data.user?.email || (user as any).email?.address || '');
      })
      .catch(console.error);
  }, [user]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Unable to select profile image:', error);
      Alert.alert(
        'Image selection failed',
        error instanceof Error ? error.message : 'Please try selecting the image again.',
      );
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploading(true);
    try {
      const file = new File(asset.uri);
      const res = await expoFetch(`${API_URL}/api/upload-avatar`, {
        method: 'POST',
        headers: { 'Content-Type': file.type || asset.mimeType || 'image/jpeg' },
        body: file,
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Image upload failed (HTTP ${res.status}).`);
      }
      if (!data.url) {
        throw new Error('The server did not return an image URL.');
      }
      setAvatarUrl(data.url);
    } catch (error) {
      console.error('Unable to upload profile image:', error);
      Alert.alert(
        'Image upload failed',
        error instanceof Error ? error.message : 'Please try uploading the image again.',
      );
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
    } catch {
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
            } catch {
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
      footer={
        <View style={{ paddingBottom: 24 }}>
          <Button label="Save Changes" loading={loading} onPress={handleSave} variant="accent" />
        </View>
      }
    >
      {/* Avatar Section */}
      <View style={styles.avatarWrap}>
        <Pressable onPress={pickImage} style={styles.avatar} disabled={uploading}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {name ? name.substring(0, 2).toUpperCase() : 'U'}
            </Text>
          )}
          
          {/* Camera Button */}
          <View style={styles.camera}>
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Ionicons name="camera" size={18} color="#fff" />
            )}
          </View>
        </Pressable>
        <Text style={styles.changePhotoText}>Tap to change photo</Text>
      </View>

      {/* Input Form */}
      <Container style={styles.formCard}>
        <TextInput 
          label="Full Name" 
          value={name} 
          onChange={setName} 
          placeholder="John Doe" 
          autoCapitalize="words" 
        />
        <TextInput 
          label="Email Address" 
          value={email} 
          onChange={setEmail} 
          placeholder="you@example.com" 
          keyboardType="email-address" 
          autoCapitalize="none" 
          editable={false} // Fixed: Prevents editing the email
        />
      </Container>

      {/* Danger Zone */}
      <Container style={styles.dangerZone}>
        <View style={styles.dangerHeader}>
          <Ionicons name="warning" size={20} color={COLORS.danger} />
          <Text style={styles.dangerTitle}>Danger Zone</Text>
        </View>
        <Text style={styles.dangerText}>
          Once you delete your account, there is no going back. Please be certain.
        </Text>
        <Button 
          label="Delete Account" 
          variant="danger" 
          loading={loading} 
          onPress={handleDeleteAccount} 
        />
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { 
    alignItems: 'center', 
    marginBottom: SPACING.s5,
    marginTop: 10,
  },
  avatar: { 
    width: 104, 
    height: 104, 
    borderRadius: 52, 
    backgroundColor: COLORS.accentSoft, 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'visible', 
    borderWidth: 2, 
    borderColor: COLORS.accentMedium,
    marginBottom: 8,
  },
  avatarImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 50 
  },
  avatarText: { 
    color: COLORS.accent, 
    fontSize: 36, 
    fontWeight: '700' 
  },
  camera: { 
    position: 'absolute', 
    right: 0, 
    bottom: 0, 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: COLORS.accent, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 3, 
    borderColor: COLORS.bg 
  },
  changePhotoText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
  formCard: {
    padding: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  dangerZone: { 
    padding: 20, 
    backgroundColor: COLORS.downSoft, 
    borderRadius: RADIUS.xl, 
    borderWidth: 1, 
    borderColor: '#FCA5A5',
    marginBottom: 20,
  },
  dangerHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 8 
  },
  dangerTitle: { 
    color: COLORS.danger, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  dangerText: { 
    color: COLORS.danger, 
    fontSize: 13, 
    marginBottom: 16, 
    lineHeight: 18, 
    opacity: 0.8 
  },
});
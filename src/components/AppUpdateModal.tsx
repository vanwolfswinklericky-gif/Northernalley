import * as Application from 'expo-application';
import { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS, RADIUS } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

interface UpdatePolicy {
  latestVersion: string;
  minimumVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
  message?: string;
}

function compareVersions(left: string, right: string) {
  const leftParts = left.split('.').map((part) => parseInt(part, 10) || 0);
  const rightParts = right.split('.').map((part) => parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function AppUpdateModal() {
  const [policy, setPolicy] = useState<UpdatePolicy | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

    let cancelled = false;

    const checkForUpdate = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/app-version?platform=${Platform.OS}&version=${encodeURIComponent(
            Application.nativeApplicationVersion ?? '1.0.0',
          )}`,
        );
        if (!response.ok) {
          throw new Error(`Update check failed (HTTP ${response.status})`);
        }

        const data = (await response.json()) as UpdatePolicy;
        if (!data.latestVersion || !data.minimumVersion || !data.storeUrl) {
          throw new Error('Update policy response was incomplete');
        }

        if (cancelled) return;
        const currentVersion = Application.nativeApplicationVersion ?? '1.0.0';
        const updateAvailable = compareVersions(currentVersion, data.latestVersion) < 0;
        const forceRequired =
          data.forceUpdate || compareVersions(currentVersion, data.minimumVersion) < 0;

        if (updateAvailable || forceRequired) {
          setPolicy({ ...data, forceUpdate: forceRequired });
          setVisible(true);
        }
      } catch (error) {
        console.warn('Unable to check for app updates:', error);
      }
    };

    checkForUpdate();
    return () => {
      cancelled = true;
    };
  }, []);

  const openStore = async () => {
    if (!policy) return;
    try {
      await Linking.openURL(policy.storeUrl);
    } catch (error) {
      console.warn('Unable to open app store:', error);
    }
  };

  if (!policy) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!policy.forceUpdate) setVisible(false);
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {policy.forceUpdate ? 'Update required' : 'Update available'}
          </Text>
          <Text style={styles.message}>
            {policy.message ??
              (policy.forceUpdate
                ? 'This version is no longer supported. Please update NorthernAlley to continue.'
                : `A new version (${policy.latestVersion}) is available with improvements and fixes.`)}
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={openStore}
          >
            <Text style={styles.primaryButtonText}>Update now</Text>
          </Pressable>
          {!policy.forceUpdate && (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.secondaryButtonText}>Not now</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 24,
  },
  title: {
    color: COLORS.t1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: COLORS.t2,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: COLORS.t2,
    fontSize: 15,
    fontWeight: '600',
  },
});

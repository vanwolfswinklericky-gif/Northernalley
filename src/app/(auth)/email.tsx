// src/app/(auth)/email.tsx

import { EmailScreen } from '@/screens/auth/EmailScreen';
import { useRouter } from 'expo-router';

export default function EmailRoute() {
  const router = useRouter();
  return (
    <EmailScreen
      onBack={() => router.back()}
    />
  );
}
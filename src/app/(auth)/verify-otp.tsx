// src/app/(auth)/verify-otp.tsx

import { OtpScreen } from '@/screens/auth/OtpScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function VerifyOtpRoute() {
  const router = useRouter();
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  return <OtpScreen onBack={() => router.back()} isLoginFlow={flow === 'login'} />;
}
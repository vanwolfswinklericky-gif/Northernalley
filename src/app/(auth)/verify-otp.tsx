// src/app/(auth)/verify-otp.tsx

import { OtpScreen } from '@/screens/auth/OtpScreen';
import { useRouter } from 'expo-router';

export default function VerifyOtpRoute() {
  const router = useRouter();
  return <OtpScreen onBack={() => router.back()} />;
}
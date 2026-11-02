import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useRouter } from 'expo-router';

export default function Welcome() {
  const router = useRouter();
  return (
    <Screen title="Welcome" subtitle="Your automated crypto investing companion.">
      <Button label="Get Started" onPress={() => router.push('/(auth)/login')} variant="accent" />
    </Screen>
  );
}
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { useLoginWithEmail } from '@privy-io/expo';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function Login() {
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      await sendCode({ email });
      setStep('code');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await loginWithCode({ code, email });
      // Do not navigate manually! RootNavigator will automatically redirect.
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Sign In" subtitle="Enter your email to continue.">
      {step === 'email' ? (
        <>
          <TextInput label="Email" value={email} onChange={setEmail} keyboardType="email-address" />
          <Button label="Send Code" onPress={handleSend} loading={loading} />
        </>
      ) : (
        <>
          <TextInput label="Code" value={code} onChange={setCode} keyboardType="number-pad" />
          <Button label="Verify" onPress={handleVerify} loading={loading} />
        </>
      )}
    </Screen>
  );
}
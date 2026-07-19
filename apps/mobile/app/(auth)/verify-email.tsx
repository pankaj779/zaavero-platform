import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authApi } from '../../lib/auth/auth-api';
import { AppText, Button, Field, LoadingState, Screen } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function VerifyEmailScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState(params.email ?? '');

  const verify = useCallback(async (token: string) => {
    setStatus('verifying');
    try {
      const { email } = await authApi.verifyEmail(token);
      setMessage(`${email} verified successfully.`);
      setStatus('success');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Verification failed.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (params.token) void verify(params.token);
  }, [params.token, verify]);

  const resend = useCallback(async () => {
    try {
      await authApi.resendVerification(resendEmail);
      setMessage('Verification email sent. Check your inbox.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not resend email.');
    }
  }, [resendEmail]);

  if (status === 'verifying') {
    return (
      <Screen>
        <LoadingState label="Verifying your email…" />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="title">Verify email</AppText>
      {message ? (
        <AppText
          variant="caption"
          color={status === 'error' ? theme.colors.danger : theme.colors.success}
          style={{ marginTop: theme.spacing(2) }}
        >
          {message}
        </AppText>
      ) : (
        <AppText variant="caption" style={{ marginTop: theme.spacing(2) }}>
          Open the verification link from your email, or resend it below.
        </AppText>
      )}

      <View style={{ gap: theme.spacing(4), marginTop: theme.spacing(6) }}>
        {status === 'success' ? (
          <Button title="Continue to sign in" onPress={() => router.replace('/(auth)/login')} />
        ) : (
          <>
            <Field
              label="Email"
              value={resendEmail}
              onChangeText={setResendEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Button title="Resend verification email" variant="secondary" onPress={resend} />
            <Button title="Back to sign in" variant="ghost" onPress={() => router.replace('/(auth)/login')} />
          </>
        )}
      </View>
    </Screen>
  );
}

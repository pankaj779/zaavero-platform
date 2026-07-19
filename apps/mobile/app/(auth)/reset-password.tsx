import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { z } from 'zod';
import { authApi } from '../../lib/auth/auth-api';
import { AppText, Button, Field, Screen } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

const schema = z.object({
  token: z.string().min(1, 'Reset code is required'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export default function ResetPasswordScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = useCallback(async () => {
    const parsed = schema.safeParse({ token, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authApi.resetPassword(parsed.data.token, parsed.data.password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setSubmitting(false);
    }
  }, [token, password]);

  if (done) {
    return (
      <Screen scroll>
        <AppText variant="title">Password updated</AppText>
        <AppText variant="caption" style={{ marginTop: theme.spacing(2) }}>
          Your password has been reset. Sign in with your new password.
        </AppText>
        <View style={{ marginTop: theme.spacing(6) }}>
          <Button title="Back to sign in" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="title">Set new password</AppText>
      <AppText variant="caption" style={{ marginBottom: theme.spacing(4) }}>
        Paste the reset code from your email and choose a new password.
      </AppText>

      <View style={{ gap: theme.spacing(4) }}>
        <Field
          label="Reset code"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          placeholder="Reset token"
        />
        <Field
          label="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 8 characters"
        />
        {error ? (
          <AppText variant="caption" color={theme.colors.danger}>
            {error}
          </AppText>
        ) : null}
        <Button title="Update password" onPress={onSubmit} loading={submitting} />
      </View>
    </Screen>
  );
}

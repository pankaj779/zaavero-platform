import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { z } from 'zod';
import { authApi } from '../../lib/auth/auth-api';
import { AppText, Button, Field, Screen } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export default function ForgotPasswordScreen(): React.JSX.Element {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = useCallback(async () => {
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid email');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authApi.forgotPassword(parsed.data.email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  }, [email]);

  return (
    <Screen scroll>
      <AppText variant="title">Reset password</AppText>
      <AppText variant="caption" style={{ marginBottom: theme.spacing(4) }}>
        {sent
          ? 'If an account exists for that email, a reset link is on its way.'
          : 'Enter your email and we will send a reset link.'}
      </AppText>

      {!sent ? (
        <View style={{ gap: theme.spacing(4) }}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            error={error ?? undefined}
          />
          <Button title="Send reset link" onPress={onSubmit} loading={submitting} />
        </View>
      ) : null}

      <View style={{ marginTop: theme.spacing(6) }}>
        <Link href="/(auth)/reset-password">
          <AppText variant="label" color={theme.colors.primary}>
            I already have a reset code
          </AppText>
        </Link>
      </View>
      <View style={{ marginTop: theme.spacing(3) }}>
        <Link href="/(auth)/login">
          <AppText variant="label" color={theme.colors.primary}>
            Back to sign in
          </AppText>
        </Link>
      </View>
    </Screen>
  );
}

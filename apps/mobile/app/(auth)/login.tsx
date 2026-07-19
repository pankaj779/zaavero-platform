import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../../lib/auth/auth-context';
import { biometric } from '../../lib/auth/biometric';
import { AppText, Button, Field, Row, Screen } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { login, loginWithBiometrics } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    void biometric.isEnabled().then(setBiometricReady);
  }, []);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Invalid input');
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await login(parsed.data);
        router.replace('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed.');
      } finally {
        setSubmitting(false);
      }
    },
    [login, router],
  );

  const onBiometric = useCallback(async () => {
    setError(null);
    const user = await loginWithBiometrics();
    if (user) router.replace('/');
    else setError('Biometric login unavailable. Sign in with your password.');
  }, [loginWithBiometrics, router]);

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing(2), marginBottom: theme.spacing(4) }}>
        <AppText variant="title">Welcome back</AppText>
        <AppText variant="caption">Sign in to your Graphology account.</AppText>
      </View>

      <View style={{ gap: theme.spacing(4) }}>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Field
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              error={formState.errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Field
              label="Password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              textContentType="password"
              placeholder="••••••••"
              error={formState.errors.password?.message}
            />
          )}
        />

        {error ? (
          <AppText variant="caption" color={theme.colors.danger}>
            {error}
          </AppText>
        ) : null}

        <Button title="Sign in" onPress={handleSubmit(onSubmit)} loading={submitting} />

        {biometricReady ? (
          <Button title="Unlock with biometrics" variant="secondary" onPress={onBiometric} />
        ) : null}

        <Row justify="space-between">
          <Link href="/(auth)/forgot-password">
            <AppText variant="label" color={theme.colors.primary}>
              Forgot password?
            </AppText>
          </Link>
          <Link href="/(auth)/register">
            <AppText variant="label" color={theme.colors.primary}>
              Create account
            </AppText>
          </Link>
        </Row>
      </View>
    </Screen>
  );
}

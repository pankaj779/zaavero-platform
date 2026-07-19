import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../../lib/auth/auth-context';
import { AppText, Button, Field, Row, Screen } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterScreen(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

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
        await register(parsed.data);
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed.');
      } finally {
        setSubmitting(false);
      }
    },
    [register],
  );

  if (done) {
    return (
      <Screen scroll>
        <AppText variant="title">Check your inbox</AppText>
        <AppText variant="caption" style={{ marginTop: theme.spacing(2) }}>
          We sent a verification email. Verify your address, then sign in.
        </AppText>
        <View style={{ marginTop: theme.spacing(6) }}>
          <Button title="Back to sign in" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="title">Create account</AppText>
      <AppText variant="caption" style={{ marginBottom: theme.spacing(4) }}>
        Join your organization on Graphology.
      </AppText>

      <View style={{ gap: theme.spacing(4) }}>
        <Controller
          control={control}
          name="firstName"
          render={({ field }) => (
            <Field
              label="First name"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Ada"
              error={formState.errors.firstName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field }) => (
            <Field
              label="Last name"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Lovelace"
              error={formState.errors.lastName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Field
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              autoCapitalize="none"
              keyboardType="email-address"
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
              secureTextEntry
              placeholder="At least 8 characters"
              error={formState.errors.password?.message}
            />
          )}
        />

        {error ? (
          <AppText variant="caption" color={theme.colors.danger}>
            {error}
          </AppText>
        ) : null}

        <Button title="Create account" onPress={handleSubmit(onSubmit)} loading={submitting} />

        <Row justify="center">
          <Link href="/(auth)/login">
            <AppText variant="label" color={theme.colors.primary}>
              Already have an account? Sign in
            </AppText>
          </Link>
        </Row>
      </View>
    </Screen>
  );
}

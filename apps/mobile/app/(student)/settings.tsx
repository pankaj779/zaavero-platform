import React, { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth/auth-context';
import { biometric } from '../../lib/auth/biometric';
import { AppText, Button, Card, Row, Screen } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function StudentSettings(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      setAvailable(await biometric.isAvailable());
      setEnabled(await biometric.isEnabled());
    })();
  }, []);

  const toggleBiometric = async (next: boolean) => {
    setBusy(true);
    try {
      if (next) {
        const ok = await biometric.enable();
        setEnabled(ok);
        if (!ok) Alert.alert('Not enabled', 'Biometric authentication was cancelled.');
      } else {
        await biometric.disable();
        setEnabled(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <AppText variant="title">Settings</AppText>

      <Card>
        <AppText variant="subtitle">Security</AppText>
        <Row justify="space-between">
          <View style={{ flex: 1, paddingRight: theme.spacing(3) }}>
            <AppText variant="body">Biometric unlock</AppText>
            <AppText variant="caption">
              {available
                ? 'Use Face ID / fingerprint to unlock your session.'
                : 'Biometrics are not available on this device.'}
            </AppText>
          </View>
          <Switch
            value={enabled}
            disabled={!available || busy}
            onValueChange={(v) => void toggleBiometric(v)}
            trackColor={{ true: theme.colors.primary }}
          />
        </Row>
      </Card>

      <Card>
        <AppText variant="subtitle">Account</AppText>
        <AppText variant="caption">{user?.email}</AppText>
        <AppText variant="caption">
          Email {user?.emailVerified ? 'verified' : 'not verified'}
        </AppText>
        {!user?.emailVerified ? (
          <View style={{ marginTop: theme.spacing(2) }}>
            <Button
              title="Verify email"
              variant="secondary"
              onPress={() => router.push('/(auth)/verify-email')}
            />
          </View>
        ) : null}
      </Card>

      <Button
        title="Sign out"
        variant="danger"
        onPress={() => {
          Alert.alert('Sign out?', 'You will need to sign in again.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
          ]);
        }}
      />
    </Screen>
  );
}

import React, { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { useAuth } from '../../lib/auth/auth-context';
import { biometric } from '../../lib/auth/biometric';
import { AppText, Button, Card, Row, Screen } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function TeacherSettings(): React.JSX.Element {
  const theme = useTheme();
  const { logout, user } = useAuth();
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    void (async () => {
      setAvailable(await biometric.isAvailable());
      setEnabled(await biometric.isEnabled());
    })();
  }, []);

  return (
    <Screen scroll>
      <AppText variant="title">Settings</AppText>
      <Card>
        <AppText variant="subtitle">Security</AppText>
        <Row justify="space-between">
          <View style={{ flex: 1, paddingRight: theme.spacing(3) }}>
            <AppText variant="body">Biometric unlock</AppText>
            <AppText variant="caption">
              {available ? 'Unlock with Face ID / fingerprint.' : 'Biometrics unavailable.'}
            </AppText>
          </View>
          <Switch
            value={enabled}
            disabled={!available}
            onValueChange={(v) =>
              void (async () => {
                if (v) setEnabled(await biometric.enable());
                else {
                  await biometric.disable();
                  setEnabled(false);
                }
              })()
            }
            trackColor={{ true: theme.colors.primary }}
          />
        </Row>
      </Card>
      <Card>
        <AppText variant="caption">{user?.email}</AppText>
      </Card>
      <Button
        title="Sign out"
        variant="danger"
        onPress={() =>
          Alert.alert('Sign out?', undefined, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
          ])
        }
      />
    </Screen>
  );
}

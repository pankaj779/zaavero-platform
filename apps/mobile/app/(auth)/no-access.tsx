import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../../lib/auth/auth-context';
import { AppText, Button, Screen } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function NoAccessScreen(): React.JSX.Element {
  const theme = useTheme();
  const { logout } = useAuth();
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing(3) }}>
        <AppText variant="title">No mobile portal</AppText>
        <AppText variant="caption">
          Your account does not have a Student, Teacher, or Admin role enabled for the mobile app.
          Contact your organization administrator.
        </AppText>
        <View style={{ marginTop: theme.spacing(4) }}>
          <Button title="Sign out" variant="secondary" onPress={() => void logout()} />
        </View>
      </View>
    </Screen>
  );
}

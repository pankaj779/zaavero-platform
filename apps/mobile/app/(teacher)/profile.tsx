import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '../../lib/auth/auth-context';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { media } from '../../lib/media/media';
import { setAvatar, uploadAsset } from '../../lib/media/upload';
import { AppText, Button, Card, Row, Screen } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function TeacherProfile(): React.JSX.Element {
  const theme = useTheme();
  const { user, refreshSession } = useAuth();
  const organizationId = useOrganizationId();
  const [uploading, setUploading] = useState(false);

  const persistAvatar = async (picked: Awaited<ReturnType<typeof media.capturePhoto>>) => {
    if (!picked || !user) return;
    setUploading(true);
    try {
      const asset = await uploadAsset(picked, {
        organizationId,
        entityType: 'USER',
        entityId: user.id,
        purpose: 'AVATAR',
      });
      await setAvatar(organizationId, asset.id);
      await refreshSession();
      Alert.alert('Avatar updated');
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen scroll>
      <AppText variant="title">Profile</AppText>
      <Card>
        <Row gap={4}>
          <Image
            source={user?.profileImage ? { uri: user.profileImage } : undefined}
            style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.surfaceAlt }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle">
              {user?.firstName} {user?.lastName}
            </AppText>
            <AppText variant="caption">{user?.email}</AppText>
            <AppText variant="caption">{user?.roles.join(', ')}</AppText>
          </View>
        </Row>
      </Card>
      <Button title="Take photo" onPress={() => void media.capturePhoto().then(persistAvatar)} loading={uploading} />
      <Button title="Choose from library" variant="secondary" onPress={() => void media.pickImage().then(persistAvatar)} loading={uploading} />
    </Screen>
  );
}

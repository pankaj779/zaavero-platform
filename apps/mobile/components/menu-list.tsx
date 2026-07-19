import React from 'react';
import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Row } from './ui';
import { useTheme } from '../lib/theme/theme';

export interface MenuItem {
  label: string;
  description?: string;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
}

export function MenuList({ items }: { items: MenuItem[] }): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  return (
    <View style={{ gap: theme.spacing(3) }}>
      {items.map((item) => (
        <Card key={item.label} onPress={() => router.push(item.href)}>
          <Row justify="space-between">
            <Row gap={3}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: theme.radius.md,
                  backgroundColor: `${theme.colors.primary}22`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <AppText variant="subtitle">{item.label}</AppText>
                {item.description ? (
                  <AppText variant="caption" numberOfLines={1}>
                    {item.description}
                  </AppText>
                ) : null}
              </View>
            </Row>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Row>
        </Card>
      ))}
    </View>
  );
}

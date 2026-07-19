import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleGuard } from '../../components/role-guard';
import { useTheme } from '../../lib/theme/theme';

export default function AdminLayout(): React.JSX.Element {
  const theme = useTheme();
  return (
    <RoleGuard role="Admin">
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
        }}
      >
        <Tabs.Screen name="dashboard" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="ai" options={{ title: 'AI', tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }} />

        <Tabs.Screen name="teachers" options={{ href: null, title: 'Teachers' }} />
        <Tabs.Screen name="students" options={{ href: null, title: 'Students' }} />
        <Tabs.Screen name="organization" options={{ href: null, title: 'Organization' }} />
        <Tabs.Screen name="audit" options={{ href: null, title: 'Audit Logs' }} />
        <Tabs.Screen name="payments" options={{ href: null, title: 'Payments' }} />
        <Tabs.Screen name="notifications" options={{ href: null, title: 'Notifications' }} />
        <Tabs.Screen name="settings" options={{ href: null, title: 'Settings' }} />
        <Tabs.Screen name="academic" options={{ href: null, title: 'Academic' }} />
      </Tabs>
    </RoleGuard>
  );
}

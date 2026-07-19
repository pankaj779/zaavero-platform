import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleGuard } from '../../components/role-guard';
import { useTheme } from '../../lib/theme/theme';

export default function TeacherLayout(): React.JSX.Element {
  const theme = useTheme();
  return (
    <RoleGuard role="Teacher">
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
        <Tabs.Screen name="courses" options={{ title: 'Courses', tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="live" options={{ title: 'Live', tabBarIcon: ({ color, size }) => <Ionicons name="videocam-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="ai" options={{ title: 'AI', tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }} />

        <Tabs.Screen name="lessons" options={{ href: null, title: 'Lessons' }} />
        <Tabs.Screen name="assignments" options={{ href: null, title: 'Assignments' }} />
        <Tabs.Screen name="students" options={{ href: null, title: 'Students' }} />
        <Tabs.Screen name="attendance" options={{ href: null, title: 'Attendance' }} />
        <Tabs.Screen name="certificates" options={{ href: null, title: 'Certificates' }} />
        <Tabs.Screen name="calendar" options={{ href: null, title: 'Calendar' }} />
        <Tabs.Screen name="messages" options={{ href: null, title: 'Messages' }} />
        <Tabs.Screen name="notifications" options={{ href: null, title: 'Notifications' }} />
        <Tabs.Screen name="analytics" options={{ href: null, title: 'Analytics' }} />
        <Tabs.Screen name="profile" options={{ href: null, title: 'Profile' }} />
        <Tabs.Screen name="settings" options={{ href: null, title: 'Settings' }} />
      </Tabs>
    </RoleGuard>
  );
}

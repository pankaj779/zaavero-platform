import React from 'react';
import { MenuList, type MenuItem } from '../../components/menu-list';
import { Screen } from '../../components/ui';

const ITEMS: MenuItem[] = [
  { label: 'Lessons', description: 'Browse lessons', href: '/(teacher)/lessons', icon: 'play-outline' },
  { label: 'Assignments', description: 'Student work', href: '/(teacher)/assignments', icon: 'document-text-outline' },
  { label: 'Students', description: 'Enrollments', href: '/(teacher)/students', icon: 'people-outline' },
  { label: 'Attendance', description: 'Session records', href: '/(teacher)/attendance', icon: 'checkmark-done-outline' },
  { label: 'Certificates', description: 'Issued certificates', href: '/(teacher)/certificates', icon: 'ribbon-outline' },
  { label: 'Calendar', description: 'Teaching schedule', href: '/(teacher)/calendar', icon: 'calendar-outline' },
  { label: 'Messages', description: 'Conversations', href: '/(teacher)/messages', icon: 'chatbubbles-outline' },
  { label: 'Notifications', description: 'Alerts', href: '/(teacher)/notifications', icon: 'notifications-outline' },
  { label: 'Analytics', description: 'Teaching metrics', href: '/(teacher)/analytics', icon: 'stats-chart-outline' },
  { label: 'Profile', description: 'Your details', href: '/(teacher)/profile', icon: 'person-outline' },
  { label: 'Settings', description: 'Security & prefs', href: '/(teacher)/settings', icon: 'settings-outline' },
];

export default function TeacherMore(): React.JSX.Element {
  return (
    <Screen scroll>
      <MenuList items={ITEMS} />
    </Screen>
  );
}

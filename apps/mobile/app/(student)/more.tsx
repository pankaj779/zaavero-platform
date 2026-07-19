import React from 'react';
import { MenuList, type MenuItem } from '../../components/menu-list';
import { Screen } from '../../components/ui';

const ITEMS: MenuItem[] = [
  { label: 'Assignments', description: 'View and track your work', href: '/(student)/assignments', icon: 'document-text-outline' },
  { label: 'Attendance', description: 'Your attendance history', href: '/(student)/attendance', icon: 'checkmark-done-outline' },
  { label: 'Progress', description: 'Course completion', href: '/(student)/progress', icon: 'trending-up-outline' },
  { label: 'Certificates', description: 'Earned certificates', href: '/(student)/certificates', icon: 'ribbon-outline' },
  { label: 'Calendar', description: 'Upcoming events', href: '/(student)/calendar', icon: 'calendar-outline' },
  { label: 'Notifications', description: 'Alerts and updates', href: '/(student)/notifications', icon: 'notifications-outline' },
  { label: 'Messages', description: 'Conversations', href: '/(student)/messages', icon: 'chatbubbles-outline' },
  { label: 'Payments', description: 'Invoices and checkout', href: '/(student)/payments', icon: 'card-outline' },
  { label: 'Downloads', description: 'Offline content', href: '/(student)/downloads', icon: 'cloud-download-outline' },
  { label: 'Profile', description: 'Your details and avatar', href: '/(student)/profile', icon: 'person-outline' },
  { label: 'Settings', description: 'Security and preferences', href: '/(student)/settings', icon: 'settings-outline' },
];

export default function StudentMore(): React.JSX.Element {
  return (
    <Screen scroll>
      <MenuList items={ITEMS} />
    </Screen>
  );
}

import React from 'react';
import { MenuList, type MenuItem } from '../../components/menu-list';
import { Screen } from '../../components/ui';

const ITEMS: MenuItem[] = [
  { label: 'Teachers', description: 'Teacher accounts', href: '/(admin)/teachers', icon: 'school-outline' },
  { label: 'Students', description: 'Student accounts', href: '/(admin)/students', icon: 'people-outline' },
  { label: 'Organization', description: 'Org membership', href: '/(admin)/organization', icon: 'business-outline' },
  { label: 'Audit logs', description: 'Security activity', href: '/(admin)/audit', icon: 'shield-checkmark-outline' },
  { label: 'Payments', description: 'Invoices & receipts', href: '/(admin)/payments', icon: 'card-outline' },
  { label: 'Notifications', description: 'Org alerts', href: '/(admin)/notifications', icon: 'notifications-outline' },
  { label: 'Academic', description: 'Courses & lessons', href: '/(admin)/academic', icon: 'library-outline' },
  { label: 'Settings', description: 'Security & prefs', href: '/(admin)/settings', icon: 'settings-outline' },
];

export default function AdminMore(): React.JSX.Element {
  return (
    <Screen scroll>
      <MenuList items={ITEMS} />
    </Screen>
  );
}

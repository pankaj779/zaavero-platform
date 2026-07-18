'use client';

import type { ReactNode } from 'react';
import { RequireAdminArea } from '../../lib/auth';
import { AdminShell } from '../../components/admin/layout';

export default function AdminLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <RequireAdminArea>
      <AdminShell>{children}</AdminShell>
    </RequireAdminArea>
  );
}

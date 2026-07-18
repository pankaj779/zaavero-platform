'use client';

import type { ReactNode } from 'react';
import { RequireStudentPortal } from '../../lib/auth';
import { DashboardShell } from '../../components/dashboard/dashboard-shell';

export default function DashboardLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <RequireStudentPortal>
      <DashboardShell>{children}</DashboardShell>
    </RequireStudentPortal>
  );
}

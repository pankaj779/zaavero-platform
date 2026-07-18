'use client';

import type { ReactNode } from 'react';
import { RequireTeacherPortal } from '../../lib/auth';
import { TeacherShell } from '../../components/teacher/layout';

export default function TeacherLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <RequireTeacherPortal>
      <TeacherShell>{children}</TeacherShell>
    </RequireTeacherPortal>
  );
}

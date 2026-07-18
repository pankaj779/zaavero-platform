'use client';

import { useMemo } from 'react';
import { useAuth } from '../../../lib/auth';
import {
  buildTeacherProfileFromAuth,
  type TeacherProfileDto,
  type TeacherSettingsViewState,
} from '../../../lib/teacher';
import { TeacherSettingsEmptyState } from './teacher-settings-empty-state';
import { TeacherSettingsErrorState } from './teacher-settings-error-state';
import { TeacherSettingsHeader } from './teacher-settings-header';
import { TeacherSettingsSections } from './teacher-settings-sections';
import { TeacherSettingsSkeleton } from './teacher-settings-skeleton';

/** Auth-backed teacher settings shell. Unsupported preference sync stays local-only. */
export function TeacherSettingsView({
  profile: profileOverride,
  viewState: viewStateOverride,
}: {
  profile?: TeacherProfileDto | null;
  viewState?: TeacherSettingsViewState;
} = {}): React.JSX.Element {
  const { user, loading, isAuthenticated } = useAuth();
  const profile = useMemo(() => {
    if (profileOverride !== undefined) {
      return profileOverride;
    }
    return user === null ? null : buildTeacherProfileFromAuth(user);
  }, [profileOverride, user]);

  const viewState: TeacherSettingsViewState =
    viewStateOverride ??
    (loading ? 'loading' : !isAuthenticated || profile === null ? 'error' : 'populated');

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <TeacherSettingsHeader />
        <TeacherSettingsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <TeacherSettingsHeader />
        <TeacherSettingsErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || !profile) {
    return (
      <div className="space-y-8">
        <TeacherSettingsHeader />
        <TeacherSettingsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TeacherSettingsHeader />
      <TeacherSettingsSections profile={profile} />
    </div>
  );
}

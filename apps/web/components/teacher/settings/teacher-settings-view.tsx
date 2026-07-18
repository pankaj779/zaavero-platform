'use client';

import { useMemo } from 'react';
import { useAuth, useOrganization } from '../../../lib/auth';
import { EmailPreferencesCard, EmailVerificationCard } from '../../shared/email-preferences-card';
import { InvitationManagementCard } from '../../shared/invitation-management-card';
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

/** Auth-backed teacher settings shell with server-synced email preferences. */
export function TeacherSettingsView({
  profile: profileOverride,
  viewState: viewStateOverride,
}: {
  profile?: TeacherProfileDto | null;
  viewState?: TeacherSettingsViewState;
} = {}): React.JSX.Element {
  const { user, loading, isAuthenticated } = useAuth();
  const { primaryOrganizationId } = useOrganization();
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
      <div className="mx-auto grid max-w-3xl gap-4">
        {primaryOrganizationId ? (
          <>
            <EmailPreferencesCard organizationId={primaryOrganizationId} />
            <InvitationManagementCard
              organizationId={primaryOrganizationId}
              allowedTypes={['STUDENT']}
              title="Student invitations"
              description="Invite learners by email. Teachers can create student invitations only."
            />
          </>
        ) : null}
        {user ? (
          <EmailVerificationCard email={user.email} verified={user.emailVerified === true} />
        ) : null}
      </div>
      <TeacherSettingsSections profile={profile} />
    </div>
  );
}

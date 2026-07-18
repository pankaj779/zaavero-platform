'use client';

import { useMemo } from 'react';
import { useAuth, useOrganization } from '../../../lib/auth';
import {
  buildTeacherProfileFromAuth,
  type TeacherProfileDto,
  type TeacherProfileViewState,
} from '../../../lib/teacher';
import { PersonalInformation } from './personal-information';
import { ProfessionalInformation } from './professional-information';
import { TeacherAccountCard } from './teacher-account-card';
import { TeacherProfileEmptyState } from './teacher-profile-empty-state';
import { TeacherProfileErrorState } from './teacher-profile-error-state';
import { TeacherProfileHeader } from './teacher-profile-header';
import { TeacherProfileSkeleton } from './teacher-profile-skeleton';
import { TeacherProfileSummary } from './teacher-profile-summary';
import { TeachingInformation } from './teaching-information';

/** Auth-backed teacher profile shell. Unsupported fields stay honest defaults. */
export function TeacherProfileView({
  profile: profileOverride,
  viewState: viewStateOverride,
}: {
  profile?: TeacherProfileDto | null;
  viewState?: TeacherProfileViewState;
} = {}): React.JSX.Element {
  const { user, loading, isAuthenticated } = useAuth();
  const { primaryOrganizationId } = useOrganization();
  const profile = useMemo(() => {
    if (profileOverride !== undefined) {
      return profileOverride;
    }
    return user === null ? null : buildTeacherProfileFromAuth(user);
  }, [profileOverride, user]);

  const viewState: TeacherProfileViewState =
    viewStateOverride ??
    (loading ? 'loading' : !isAuthenticated || profile === null ? 'error' : 'populated');

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <TeacherProfileHeader />
        <TeacherProfileSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <TeacherProfileHeader />
        <TeacherProfileErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || !profile) {
    return (
      <div className="space-y-8">
        <TeacherProfileHeader />
        <TeacherProfileEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TeacherProfileHeader />
      <div className="grid gap-6 laptop:grid-cols-[18rem_minmax(0,1fr)] laptop:items-start">
        <TeacherProfileSummary profile={profile} organizationId={primaryOrganizationId ?? ''} />
        <div className="min-w-0 space-y-4">
          <PersonalInformation profile={profile} />
          <ProfessionalInformation profile={profile} />
          <TeachingInformation profile={profile} />
          <TeacherAccountCard profile={profile} />
        </div>
      </div>
    </div>
  );
}

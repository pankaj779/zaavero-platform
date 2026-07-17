import {
  profileViewState,
  studentProfile,
  type ProfileViewState,
  type StudentProfileDto,
} from '../../../lib/dashboard';
import { AcademicInformation } from './academic-information';
import { AccountStatusCard } from './account-status-card';
import { OrganizationCard } from './organization-card';
import { PersonalInformation } from './personal-information';
import { ProfileEmptyState } from './profile-empty-state';
import { ProfileErrorState } from './profile-error-state';
import { ProfileHeader } from './profile-header';
import { ProfileSkeleton } from './profile-skeleton';
import { ProfileSummary } from './profile-summary';

export function ProfileView({
  profile = studentProfile,
  viewState = profileViewState,
}: {
  profile?: StudentProfileDto | null;
  viewState?: ProfileViewState;
}): React.JSX.Element {
  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <ProfileHeader />
        <ProfileSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <ProfileHeader />
        <ProfileErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || !profile) {
    return (
      <div className="space-y-8">
        <ProfileHeader />
        <ProfileEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProfileHeader />

      <div className="grid gap-6 laptop:grid-cols-[18rem_minmax(0,1fr)] laptop:items-start">
        <ProfileSummary profile={profile} />

        <div className="min-w-0 space-y-4">
          <PersonalInformation profile={profile} />
          <AcademicInformation profile={profile} />
          <OrganizationCard profile={profile} />
          <AccountStatusCard profile={profile} />
        </div>
      </div>
    </div>
  );
}

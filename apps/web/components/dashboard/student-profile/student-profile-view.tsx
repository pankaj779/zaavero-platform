'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { StudentApi } from '../../../lib/api';
import { useAuth, useOrganization } from '../../../lib/auth';
import type { StudentProfileDto } from '../../../lib/student';
import { TeacherModuleErrorState } from '../../teacher/shared';
import {
  DEFAULT_STUDENT_CLIENT_PREFERENCES,
  loadStudentClientPreferences,
  type StudentClientPreferences,
} from '../student-settings/preferences-storage';
import { studentProfileCopy } from './copy';
import {
  LearningStatsCard,
  OrganizationMembershipCard,
  PersonalIdentityCard,
  PreferencesSummaryCard,
  ProfileCertificatesCard,
} from './student-profile-panels';
import { StudentProfileHeader } from './student-profile-header';
import { StudentProfileSkeleton } from './student-profile-skeleton';
import { StudentProfileSummary } from './student-profile-summary';

export function StudentProfileView(): React.JSX.Element {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { primaryOrganizationId } = useOrganization();

  const [profile, setProfile] = useState<StudentProfileDto | null>(null);
  const [preferences, setPreferences] = useState<StudentClientPreferences>(
    DEFAULT_STUDENT_CLIENT_PREFERENCES,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!isAuthenticated || user === null) {
      setProfile(null);
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);
    setPreferences(loadStudentClientPreferences(user.id));

    void StudentApi.getProfile(user, primaryOrganizationId ?? undefined)
      .then((result) => {
        if (requestId === requestIdRef.current) {
          setProfile(result);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setProfile(null);
          setError(true);
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [authLoading, isAuthenticated, primaryOrganizationId, requestVersion, user]);

  const retry = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  if ((authLoading || loading) && profile === null && !error) {
    return (
      <div className="space-y-8">
        <StudentProfileHeader />
        <StudentProfileSkeleton />
      </div>
    );
  }

  if (error || profile === null) {
    return (
      <div className="space-y-8">
        <StudentProfileHeader />
        <TeacherModuleErrorState
          title={studentProfileCopy.errorTitle}
          description={studentProfileCopy.errorDescription}
          retryLabel={studentProfileCopy.retryButton}
          onRetry={retry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StudentProfileHeader />
      <div className="grid gap-6 laptop:grid-cols-[18rem_minmax(0,1fr)] laptop:items-start">
        <StudentProfileSummary profile={profile} organizationId={primaryOrganizationId ?? ''} />
        <div className="min-w-0 space-y-4">
          <PersonalIdentityCard profile={profile} authUser={user} />
          <OrganizationMembershipCard organizationIds={profile.organizationIds} />
          <LearningStatsCard profile={profile} />
          <ProfileCertificatesCard profile={profile} />
          <PreferencesSummaryCard preferences={preferences} />
        </div>
      </div>
    </div>
  );
}

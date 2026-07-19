import React from 'react';
import { useAuth } from '../../lib/auth/auth-context';
import { AppText, Card, Screen } from '../../components/ui';

export default function AdminOrganization(): React.JSX.Element {
  const { user, organizationIds, primaryOrganizationId } = useAuth();
  return (
    <Screen scroll>
      <AppText variant="title">Organization</AppText>
      <AppText variant="caption">
        Organization data is managed through the existing NestJS APIs. The active organization scopes
        every admin request.
      </AppText>
      <Card>
        <AppText variant="label">Active organization</AppText>
        <AppText variant="body">{primaryOrganizationId ?? '—'}</AppText>
      </Card>
      <Card>
        <AppText variant="label">Memberships</AppText>
        {organizationIds.map((id) => (
          <AppText key={id} variant="caption">
            {id}
          </AppText>
        ))}
      </Card>
      <Card>
        <AppText variant="label">Administrator</AppText>
        <AppText variant="body">
          {user?.firstName} {user?.lastName}
        </AppText>
        <AppText variant="caption">{user?.email}</AppText>
      </Card>
    </Screen>
  );
}

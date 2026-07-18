'use client';

import { Badge, Card, CardContent, CardHeader, CardTitle, Input } from '@graphology/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdminPermissionDto, AdminRoleDto } from '../../../lib/admin';
import { AdminApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import { AdminCapabilityNotice, AdminPageHeader } from '../shared';

export function AdminRolesView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [roles, setRoles] = useState<AdminRoleDto[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissionDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!primaryOrganizationId) {
      setError(true);
      setLoading(false);
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(false);
    try {
      const [roleList, permissionList] = await Promise.all([
        AdminApi.getRoles(primaryOrganizationId),
        AdminApi.getPermissions(primaryOrganizationId),
      ]);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setRoles(roleList);
      setPermissions(permissionList);
      setSelectedId((current) => current ?? roleList[0]?.id ?? null);
    } catch {
      if (requestId === requestIdRef.current) {
        setError(true);
        setRoles([]);
        setPermissions([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [primaryOrganizationId]);

  useEffect(() => {
    void load();
  }, [load, version]);

  const selected = roles.find((role) => role.id === selectedId) ?? null;
  const selectedPermissionIds = useMemo(
    () => new Set((selected?.permissions ?? []).map((permission) => permission.id)),
    [selected],
  );

  const filteredPermissions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return permissions;
    }
    return permissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(needle) ||
        permission.module.toLowerCase().includes(needle) ||
        (permission.description ?? '').toLowerCase().includes(needle),
    );
  }, [permissions, query]);

  const modules = useMemo(() => {
    const values = Array.from(new Set(filteredPermissions.map((item) => item.module))).sort();
    return values;
  }, [filteredPermissions]);

  if (loading && roles.length === 0 && !error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Roles & Permissions"
          description="Inspect RBAC roles, permissions, and assignments."
        />
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading roles…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Roles & Permissions"
          description="Inspect RBAC roles, permissions, and assignments."
        />
        <TeacherModuleErrorState
          title="Unable to load roles"
          description="Retry to reload roles and permissions."
          onRetry={() => {
            setVersion((current) => current + 1);
          }}
        />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Roles & Permissions"
          description="Inspect RBAC roles, permissions, and assignments."
        />
        <TeacherModuleEmptyState
          title="No roles configured"
          description="Organization roles will appear here once RBAC seed data is available."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Roles & Permissions"
        description="Inspect RBAC roles, permissions, and assignments."
      />

      <div className="grid gap-6 laptop:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Roles ({roles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {roles.map((role) => (
                <li key={role.id}>
                  <button
                    type="button"
                    className={`flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      role.id === selectedId ? 'bg-muted/70' : ''
                    }`}
                    onClick={() => {
                      setSelectedId(role.id);
                    }}
                  >
                    <span>
                      <span className="block text-sm font-medium">{role.name}</span>
                      <span className="block text-caption text-muted-foreground">
                        {role.description ?? 'No description'}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <Badge variant={role.isSystem ? 'secondary' : 'neutral'}>
                        {role.isSystem ? 'System' : 'Custom'}
                      </Badge>
                      <span className="text-caption text-muted-foreground">
                        {role.userCount ?? 0} users
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">
              {selected ? `${selected.name} permission matrix` : 'Permission matrix'}
            </CardTitle>
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Search permissions"
              aria-label="Search permissions"
            />
          </CardHeader>
          <CardContent className="space-y-6">
            {selected ? (
              <>
                <p className="text-small text-muted-foreground">
                  {selected.permissions?.length ?? 0} permissions assigned ·{' '}
                  {selected.userCount ?? 0} users currently hold this role.
                </p>
                {modules.map((module) => (
                  <section key={module} className="space-y-2" aria-label={`${module} permissions`}>
                    <h3 className="text-sm font-medium capitalize">{module}</h3>
                    <ul className="space-y-2">
                      {filteredPermissions
                        .filter((permission) => permission.module === module)
                        .map((permission) => {
                          const assigned = selectedPermissionIds.has(permission.id);
                          return (
                            <li
                              key={permission.id}
                              className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2"
                            >
                              <span>
                                <span className="block text-sm font-medium">{permission.name}</span>
                                <span className="block text-caption text-muted-foreground">
                                  {permission.description ?? 'No description'}
                                </span>
                              </span>
                              <Badge variant={assigned ? 'secondary' : 'neutral'}>
                                {assigned ? 'Granted' : 'Not granted'}
                              </Badge>
                            </li>
                          );
                        })}
                    </ul>
                  </section>
                ))}
              </>
            ) : (
              <p className="text-small text-muted-foreground">
                Select a role to inspect permissions.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminCapabilityNotice
        title="Role mutation audit"
        description="Role assignment is available from User Management. Creating or editing role definitions is intentionally read-only until a dedicated role mutation API is added. Assignment changes are recorded in Audit Logs."
      />
    </div>
  );
}

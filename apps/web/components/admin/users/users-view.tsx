'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@graphology/ui';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { AdminRoleDto, AdminUserDto } from '../../../lib/admin';
import { AdminApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import { AdminPageHeader } from '../shared';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type RoleFilter = 'all' | 'Admin' | 'Teacher' | 'Student';
type ActiveFilter = 'all' | 'active' | 'inactive';
type SortBy = 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email';

export function AdminUsersView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [active, setActive] = useState<ActiveFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminUserDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState<AdminRoleDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, role, active, sortBy, sortOrder]);

  const loadList = useCallback(async () => {
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
      const [users, roleList] = await Promise.all([
        AdminApi.getUsers({
          organizationId: primaryOrganizationId,
          search: debouncedQuery || undefined,
          role: role === 'all' ? undefined : role,
          isActive: active === 'all' ? undefined : active === 'active',
          page,
          limit: PAGE_SIZE,
          sortBy,
          sortOrder,
        }),
        AdminApi.getRoles(primaryOrganizationId),
      ]);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems(users.items);
      setTotal(users.meta.total);
      setTotalPages(Math.max(1, users.meta.totalPages));
      setRoles(roleList);
      if (users.items.length > 0) {
        setSelectedId((current) => current ?? users.items[0]?.id ?? null);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError(true);
        setItems([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [active, debouncedQuery, page, primaryOrganizationId, role, sortBy, sortOrder]);

  useEffect(() => {
    void loadList();
  }, [loadList, version]);

  useEffect(() => {
    if (!selectedId || !primaryOrganizationId) {
      setSelected(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void AdminApi.getUser(selectedId, primaryOrganizationId)
      .then((user) => {
        if (!cancelled) {
          setSelected(user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelected(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [primaryOrganizationId, selectedId]);

  const selectedRoleIds = useMemo(
    () => new Set(selected?.roles.map((item) => item.id) ?? []),
    [selected],
  );

  async function handleCreate(form: CreateUserFormState): Promise<void> {
    if (!primaryOrganizationId) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await AdminApi.createUser({
        organizationId: primaryOrganizationId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        roleName: form.roleName,
      });
      setCreateOpen(false);
      setSelectedId(created.id);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to create user. Check required fields and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile(updates: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }): Promise<void> {
    if (!selected || !primaryOrganizationId) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const updated = await AdminApi.updateUser(selected.id, primaryOrganizationId, {
        firstName: updates.firstName.trim(),
        lastName: updates.lastName.trim(),
        email: updates.email.trim(),
        phone: updates.phone.trim() || null,
      });
      setSelected(updated);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to update user profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(): Promise<void> {
    if (!selected || !primaryOrganizationId) {
      return;
    }
    setSaving(true);
    try {
      const updated = await AdminApi.updateUser(selected.id, primaryOrganizationId, {
        isActive: !selected.isActive,
      });
      setSelected(updated);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to update account status.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignRoles(roleIds: string[]): Promise<void> {
    if (!selected || !primaryOrganizationId) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const updated = await AdminApi.assignUserRoles(selected.id, primaryOrganizationId, roleIds);
      setSelected(updated);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to update role assignments.');
    } finally {
      setSaving(false);
    }
  }

  if (loading && items.length === 0 && !error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="User Management"
          description="Manage administrators, teachers, students, roles, and access."
        />
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading users…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="User Management"
          description="Manage administrators, teachers, students, roles, and access."
        />
        <TeacherModuleErrorState
          title="Unable to load users"
          description="Retry to reload organization members."
          onRetry={() => {
            setVersion((current) => current + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="User Management"
        description="Manage administrators, teachers, students, roles, and access."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            Create user
          </Button>
        }
      />

      <section
        className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-5"
        aria-label="User filters"
      >
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder="Search name or email"
          aria-label="Search users"
        />
        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value as RoleFilter);
          }}
        >
          <SelectTrigger aria-label="Filter by role">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="Admin">Admins</SelectItem>
            <SelectItem value="Teacher">Teachers</SelectItem>
            <SelectItem value="Student">Students</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={active}
          onValueChange={(value) => {
            setActive(value as ActiveFilter);
          }}
        >
          <SelectTrigger aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value as SortBy);
          }}
        >
          <SelectTrigger aria-label="Sort by field">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created</SelectItem>
            <SelectItem value="updatedAt">Updated</SelectItem>
            <SelectItem value="firstName">First name</SelectItem>
            <SelectItem value="lastName">Last name</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortOrder}
          onValueChange={(value) => {
            setSortOrder(value as 'asc' | 'desc');
          }}
        >
          <SelectTrigger aria-label="Sort order">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {items.length === 0 ? (
        <TeacherModuleEmptyState
          title="No users found"
          description="Adjust filters or create a new organization member."
        />
      ) : (
        <div className="grid gap-6 laptop:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Members ({total})</CardTitle>
              <p className="text-caption text-muted-foreground">
                Page {page} of {totalPages}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="divide-y divide-border rounded-lg border border-border">
                {items.map((user) => {
                  const isSelected = user.id === selectedId;
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(user.id);
                        }}
                        className={`flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isSelected ? 'bg-muted/70' : ''
                        }`}
                        aria-current={isSelected ? 'true' : undefined}
                      >
                        <span>
                          <span className="block text-sm font-medium">{user.fullName}</span>
                          <span className="block text-caption text-muted-foreground">
                            {user.email}
                          </span>
                        </span>
                        <span className="flex flex-col items-end gap-1">
                          <Badge variant={user.isActive ? 'secondary' : 'neutral'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className="text-caption text-muted-foreground">
                            {user.roles.map((item) => item.name).join(', ') || 'No roles'}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1));
                  }}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((current) => current + 1);
                  }}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          <UserDetailsPanel
            user={selected}
            loading={detailLoading}
            roles={roles}
            selectedRoleIds={selectedRoleIds}
            saving={saving}
            formError={formError}
            onSaveProfile={handleSaveProfile}
            onToggleActive={handleToggleActive}
            onAssignRoles={handleAssignRoles}
          />
        </div>
      )}

      <CreateUserDialog
        open={createOpen}
        saving={saving}
        error={formError}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function UserDetailsPanel({
  user,
  loading,
  roles,
  selectedRoleIds,
  saving,
  formError,
  onSaveProfile,
  onToggleActive,
  onAssignRoles,
}: {
  user: AdminUserDto | null;
  loading: boolean;
  roles: AdminRoleDto[];
  selectedRoleIds: Set<string>;
  saving: boolean;
  formError: string | null;
  onSaveProfile: (updates: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) => Promise<void>;
  onToggleActive: () => Promise<void>;
  onAssignRoles: (roleIds: string[]) => Promise<void>;
}): React.JSX.Element {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [draftRoleIds, setDraftRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setPhone(user.phone ?? '');
    setDraftRoleIds(user.roles.map((role) => role.id));
  }, [user]);

  if (loading && !user) {
    return (
      <Card className="rounded-xl">
        <CardContent className="py-16 text-center text-small text-muted-foreground">
          Loading user details…
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="rounded-xl">
        <CardContent className="py-16 text-center text-small text-muted-foreground">
          Select a user to review details, roles, and permissions.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">{user.fullName}</CardTitle>
        <p className="text-caption text-muted-foreground">
          Member since {new Date(user.membership.joinedAt).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {formError ? (
          <p className="text-small text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="grid gap-3">
          <Field label="First name" value={firstName} onChange={setFirstName} />
          <Field label="Last name" value={lastName} onChange={setLastName} />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="Phone" value={phone} onChange={setPhone} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={saving}
            onClick={() => void onSaveProfile({ firstName, lastName, email, phone })}
          >
            Save profile
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => void onToggleActive()}
          >
            {user.isActive ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>

        <section className="space-y-3" aria-label="Role management">
          <h3 className="text-sm font-medium">Roles</h3>
          <ul className="space-y-2">
            {roles.map((role) => {
              const checked = draftRoleIds.includes(role.id);
              return (
                <li key={role.id}>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={(event) => {
                        setDraftRoleIds((current) =>
                          event.target.checked
                            ? [...current, role.id]
                            : current.filter((id) => id !== role.id),
                        );
                      }}
                    />
                    <span>
                      <span className="font-medium">{role.name}</span>
                      <span className="block text-caption text-muted-foreground">
                        {role.description ?? (role.isSystem ? 'System role' : 'Custom role')}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => void onAssignRoles(draftRoleIds)}
          >
            Save roles
          </Button>
        </section>

        <section className="space-y-2" aria-label="Permission display">
          <h3 className="text-sm font-medium">Permissions</h3>
          {user.roles.flatMap((role) => role.permissions ?? []).length === 0 ? (
            <p className="text-small text-muted-foreground">
              No permissions loaded for assigned roles.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {Array.from(
                new Set(
                  user.roles.flatMap((role) =>
                    (role.permissions ?? []).map((permission) => permission.name),
                  ),
                ),
              ).map((permission) => (
                <Badge key={permission} variant="neutral">
                  {permission}
                </Badge>
              ))}
            </ul>
          )}
          <p className="text-caption text-muted-foreground">
            Organization assignment: {user.membership.status}
            {selectedRoleIds.size > 0 ? ` · ${String(selectedRoleIds.size)} role(s)` : ''}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}): React.JSX.Element {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </div>
  );
}

interface CreateUserFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  roleName: 'Admin' | 'Teacher' | 'Student';
}

function CreateUserDialog({
  open,
  saving,
  error,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: CreateUserFormState) => Promise<void>;
}): React.JSX.Element {
  const [form, setForm] = useState<CreateUserFormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    roleName: 'Student',
  });

  useEffect(() => {
    if (!open) {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        roleName: 'Student',
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Add an organization member with an initial role assignment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field
            label="First name"
            value={form.firstName}
            onChange={(firstName) => {
              setForm((current) => ({ ...current, firstName }));
            }}
          />
          <Field
            label="Last name"
            value={form.lastName}
            onChange={(lastName) => {
              setForm((current) => ({ ...current, lastName }));
            }}
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(email) => {
              setForm((current) => ({ ...current, email }));
            }}
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(phone) => {
              setForm((current) => ({ ...current, phone }));
            }}
          />
          <Field
            label="Temporary password"
            type="password"
            value={form.password}
            onChange={(password) => {
              setForm((current) => ({ ...current, password }));
            }}
          />
          <div className="space-y-1.5">
            <Label>Initial role</Label>
            <Select
              value={form.roleName}
              onValueChange={(roleName) => {
                setForm((current) => ({
                  ...current,
                  roleName: roleName as CreateUserFormState['roleName'],
                }));
              }}
            >
              <SelectTrigger aria-label="Initial role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Teacher">Teacher</SelectItem>
                <SelectItem value="Student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error ? (
            <p className="text-small text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void onSubmit(form)}>
            {saving ? 'Creating…' : 'Create user'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

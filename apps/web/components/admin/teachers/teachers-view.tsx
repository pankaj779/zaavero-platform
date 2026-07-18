'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@graphology/ui';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { AdminUserDto } from '../../../lib/admin';
import {
  AdminApi,
  AssignmentApi,
  BatchApi,
  CertificateApi,
  LiveSessionApi,
} from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import { AdminPageHeader } from '../shared';

interface TeacherActivity {
  courses: { id: string; title: string }[];
  batches: { id: string; name: string }[];
  liveSessions: { id: string; title: string; status: string }[];
  assignments: { id: string; title: string; status: string }[];
  certificates: { id: string; courseTitle: string; status: string }[];
}

const SEARCH_DEBOUNCE_MS = 300;

export function AdminTeachersView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [teachers, setTeachers] = useState<AdminUserDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUserDto | null>(null);
  const [activity, setActivity] = useState<TeacherActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const requestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const loadTeachers = useCallback(async () => {
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
      const result = await AdminApi.getUsers({
        organizationId: primaryOrganizationId,
        role: 'Teacher',
        search: debouncedQuery || undefined,
        page: 1,
        limit: 100,
        sortBy: 'firstName',
        sortOrder: 'asc',
      });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setTeachers(result.items);
      setSelectedId((current) => current ?? result.items[0]?.id ?? null);
    } catch {
      if (requestId === requestIdRef.current) {
        setError(true);
        setTeachers([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedQuery, primaryOrganizationId]);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers, version]);

  useEffect(() => {
    if (!selectedId || !primaryOrganizationId) {
      setSelected(null);
      setActivity(null);
      return;
    }
    const detailRequestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = detailRequestId;
    setDetailLoading(true);
    void (async () => {
      try {
        const user = await AdminApi.getUser(selectedId, primaryOrganizationId);
        if (detailRequestId !== detailRequestIdRef.current) {
          return;
        }
        setSelected(user);
        setBio(user.teacherProfile?.bio ?? '');
        setQualifications((user.teacherProfile?.qualifications ?? []).join(', '));
        setSpecializations((user.teacherProfile?.specializations ?? []).join(', '));
        setExperienceYears(String(user.teacherProfile?.experienceYears ?? 0));

        const teacherProfileId = user.teacherProfile?.id;
        if (!teacherProfileId) {
          setActivity({
            courses: [],
            batches: [],
            liveSessions: [],
            assignments: [],
            certificates: [],
          });
          return;
        }

        const [batches, liveSessions, assignments, certificates] = await Promise.all([
          BatchApi.getBatches({
            organizationId: primaryOrganizationId,
            teacherId: teacherProfileId,
            page: 1,
            limit: 50,
          }),
          LiveSessionApi.getLiveSessions({
            organizationId: primaryOrganizationId,
            page: 1,
            limit: 100,
          }),
          AssignmentApi.getAssignments({
            organizationId: primaryOrganizationId,
            page: 1,
            limit: 100,
          }),
          CertificateApi.getCertificates({
            organizationId: primaryOrganizationId,
            page: 1,
            limit: 100,
          }),
        ]);

        if (detailRequestId !== detailRequestIdRef.current) {
          return;
        }

        const courseMap = new Map<string, string>();
        for (const batch of batches.items) {
          courseMap.set(batch.course.id, batch.course.title);
        }
        const courseIds = new Set(courseMap.keys());
        const batchIds = new Set(batches.items.map((batch) => batch.id));
        setActivity({
          courses: Array.from(courseMap.entries()).map(([id, title]) => ({ id, title })),
          batches: batches.items.map((batch) => ({ id: batch.id, name: batch.name })),
          liveSessions: liveSessions.items
            .filter((session) => batchIds.has(session.batch.id))
            .map((session) => ({
              id: session.id,
              title: session.title,
              status: session.status,
            })),
          assignments: assignments.items
            .filter((assignment) => courseIds.has(assignment.course.id))
            .map((assignment) => ({
              id: assignment.id,
              title: assignment.title,
              status: assignment.status,
            })),
          certificates: certificates.items
            .filter((certificate) => courseIds.has(certificate.course.id))
            .map((certificate) => ({
              id: certificate.id,
              courseTitle: certificate.course.title,
              status: certificate.status,
            })),
        });
      } catch {
        if (detailRequestId === detailRequestIdRef.current) {
          setSelected(null);
          setActivity(null);
        }
      } finally {
        if (detailRequestId === detailRequestIdRef.current) {
          setDetailLoading(false);
        }
      }
    })();
  }, [primaryOrganizationId, selectedId, version]);

  async function saveProfile(): Promise<void> {
    if (!selected?.teacherProfile || !primaryOrganizationId) {
      setFormError('This teacher does not have a teacher profile yet.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await AdminApi.updateTeacherProfile(selected.teacherProfile.id, {
        organizationId: primaryOrganizationId,
        bio: bio.trim() || null,
        qualifications: qualifications
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        specializations: specializations
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        experienceYears: Number.parseInt(experienceYears, 10) || 0,
      });
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to update teacher profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading && teachers.length === 0 && !error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Teacher Management"
          description="Review teacher profiles, assignments, courses, and teaching activity."
        />
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading teachers…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Teacher Management"
          description="Review teacher profiles, assignments, courses, and teaching activity."
        />
        <TeacherModuleErrorState
          title="Unable to load teachers"
          description="Retry to reload teacher profiles."
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
        title="Teacher Management"
        description="Review teacher profiles, assignments, courses, and teaching activity."
      />

      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        placeholder="Search teachers"
        aria-label="Search teachers"
        className="max-w-md"
      />

      {teachers.length === 0 ? (
        <TeacherModuleEmptyState
          title="No teachers found"
          description="Create a teacher from User Management or adjust your search."
        />
      ) : (
        <div className="grid gap-6 laptop:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Teachers ({teachers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {teachers.map((teacher) => (
                  <li key={teacher.id}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between px-3 py-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        teacher.id === selectedId ? 'bg-muted/70' : ''
                      }`}
                      onClick={() => {
                        setSelectedId(teacher.id);
                      }}
                    >
                      <span>
                        <span className="block text-sm font-medium">{teacher.fullName}</span>
                        <span className="block text-caption text-muted-foreground">
                          {teacher.email}
                        </span>
                      </span>
                      <Badge variant={teacher.isActive ? 'secondary' : 'neutral'}>
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">{selected?.fullName ?? 'Teacher details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {detailLoading && !selected ? (
                <p className="text-small text-muted-foreground">Loading teacher details…</p>
              ) : null}
              {selected ? (
                <>
                  {formError ? (
                    <p className="text-small text-destructive" role="alert">
                      {formError}
                    </p>
                  ) : null}
                  <div className="grid gap-3">
                    <TextField label="Bio" value={bio} onChange={setBio} multiline />
                    <TextField
                      label="Qualifications (comma separated)"
                      value={qualifications}
                      onChange={setQualifications}
                    />
                    <TextField
                      label="Specializations (comma separated)"
                      value={specializations}
                      onChange={setSpecializations}
                    />
                    <TextField
                      label="Experience years"
                      value={experienceYears}
                      onChange={setExperienceYears}
                    />
                  </div>
                  <Button size="sm" disabled={saving} onClick={() => void saveProfile()}>
                    Save teacher profile
                  </Button>

                  <div className="grid gap-4 tablet:grid-cols-2">
                    <StatCard label="Courses" value={activity?.courses.length ?? 0} />
                    <StatCard label="Batches" value={activity?.batches.length ?? 0} />
                    <StatCard label="Live sessions" value={activity?.liveSessions.length ?? 0} />
                    <StatCard label="Assignments" value={activity?.assignments.length ?? 0} />
                    <StatCard
                      label="Certificates issued"
                      value={activity?.certificates.length ?? 0}
                    />
                  </div>

                  <ActivityList
                    title="Assigned courses"
                    items={(activity?.courses ?? []).map((item) => item.title)}
                    empty="No assigned courses"
                  />
                  <ActivityList
                    title="Assigned batches"
                    items={(activity?.batches ?? []).map((item) => item.name)}
                    empty="No assigned batches"
                  />
                  <ActivityList
                    title="Live sessions"
                    items={(activity?.liveSessions ?? []).map(
                      (item) => `${item.title} · ${item.status}`,
                    )}
                    empty="No live sessions"
                  />
                  <ActivityList
                    title="Assignments"
                    items={(activity?.assignments ?? []).map(
                      (item) => `${item.title} · ${item.status}`,
                    )}
                    empty="No related assignments"
                  />
                  <ActivityList
                    title="Certificates"
                    items={(activity?.certificates ?? []).map(
                      (item) => `${item.courseTitle} · ${item.status}`,
                    )}
                    empty="No related certificates"
                  />
                </>
              ) : (
                <p className="text-small text-muted-foreground">Select a teacher to continue.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}): React.JSX.Element {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader className="pb-2">
        <p className="text-caption text-muted-foreground">{label}</p>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ActivityList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}): React.JSX.Element {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="text-small text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 8).map((item) => (
            <li key={item} className="rounded-md border border-border px-3 py-2 text-small">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@graphology/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminUserDto } from '../../../lib/admin';
import {
  AdminApi,
  AttendanceApi,
  CertificateApi,
  EnrollmentApi,
  SubmissionApi,
} from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import { AdminPageHeader } from '../shared';

interface StudentActivity {
  enrollments: { id: string; courseTitle: string; batchName: string; status: string }[];
  attendance: { id: string; status: string; detail: string }[];
  submissions: { id: string; title: string; status: string }[];
  certificates: { id: string; courseTitle: string; status: string }[];
}

const SEARCH_DEBOUNCE_MS = 300;

export function AdminStudentsView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [students, setStudents] = useState<AdminUserDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUserDto | null>(null);
  const [activity, setActivity] = useState<StudentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [version, setVersion] = useState(0);
  const requestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const loadStudents = useCallback(async () => {
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
        role: 'Student',
        search: debouncedQuery || undefined,
        page: 1,
        limit: 100,
        sortBy: 'firstName',
        sortOrder: 'asc',
      });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setStudents(result.items);
      setSelectedId((current) => current ?? result.items[0]?.id ?? null);
    } catch {
      if (requestId === requestIdRef.current) {
        setError(true);
        setStudents([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedQuery, primaryOrganizationId]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents, version]);

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
        setFirstName(user.firstName);
        setLastName(user.lastName);
        setEmail(user.email);
        setPhone(user.phone ?? '');

        const [enrollments, attendance, submissions, certificates] = await Promise.all([
          EnrollmentApi.getEnrollments({
            organizationId: primaryOrganizationId,
            studentId: selectedId,
            page: 1,
            limit: 50,
          }),
          AttendanceApi.getAttendances({
            organizationId: primaryOrganizationId,
            studentId: selectedId,
            page: 1,
            limit: 50,
          }),
          SubmissionApi.getSubmissions({
            organizationId: primaryOrganizationId,
            studentId: selectedId,
            page: 1,
            limit: 50,
          }),
          CertificateApi.getCertificates({
            organizationId: primaryOrganizationId,
            studentId: selectedId,
            page: 1,
            limit: 50,
          }),
        ]);

        if (detailRequestId !== detailRequestIdRef.current) {
          return;
        }

        setActivity({
          enrollments: enrollments.items.map((item) => ({
            id: item.id,
            courseTitle: item.course.title,
            batchName: item.batch.name,
            status: item.enrollmentStatus,
          })),
          attendance: attendance.items.map((session) => {
            const record = session.records.find((entry) => entry.studentId === selectedId);
            return {
              id: session.id,
              status: record?.status ?? session.status,
              detail: session.title,
            };
          }),
          submissions: submissions.items.map((item) => ({
            id: item.id,
            title: item.assignment.title,
            status: item.status,
          })),
          certificates: certificates.items.map((item) => ({
            id: item.id,
            courseTitle: item.course.title,
            status: item.status,
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
    if (!selected || !primaryOrganizationId) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const updated = await AdminApi.updateUser(selected.id, primaryOrganizationId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      });
      setSelected(updated);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to update student profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading && students.length === 0 && !error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Student Management"
          description="Review learner profiles, enrollments, progress, and outcomes."
        />
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading students…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Student Management"
          description="Review learner profiles, enrollments, progress, and outcomes."
        />
        <TeacherModuleErrorState
          title="Unable to load students"
          description="Retry to reload student profiles."
          onRetry={() => {
            setVersion((current) => current + 1);
          }}
        />
      </div>
    );
  }

  const progressLabel =
    activity && activity.enrollments.length > 0
      ? `${String(activity.certificates.filter((item) => item.status === 'issued').length)}/${String(activity.enrollments.length)} courses certified`
      : 'No enrollment progress yet';

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Student Management"
        description="Review learner profiles, enrollments, progress, and outcomes."
      />

      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        placeholder="Search students"
        aria-label="Search students"
        className="max-w-md"
      />

      {students.length === 0 ? (
        <TeacherModuleEmptyState
          title="No students found"
          description="Create a student from User Management or adjust your search."
        />
      ) : (
        <div className="grid gap-6 laptop:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Students ({students.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {students.map((student) => (
                  <li key={student.id}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between px-3 py-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        student.id === selectedId ? 'bg-muted/70' : ''
                      }`}
                      onClick={() => {
                        setSelectedId(student.id);
                      }}
                    >
                      <span>
                        <span className="block text-sm font-medium">{student.fullName}</span>
                        <span className="block text-caption text-muted-foreground">
                          {student.email}
                        </span>
                      </span>
                      <Badge variant={student.isActive ? 'secondary' : 'neutral'}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">{selected?.fullName ?? 'Student details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {detailLoading && !selected ? (
                <p className="text-small text-muted-foreground">Loading student details…</p>
              ) : null}
              {selected ? (
                <>
                  {formError ? (
                    <p className="text-small text-destructive" role="alert">
                      {formError}
                    </p>
                  ) : null}
                  <div className="grid gap-3 tablet:grid-cols-2">
                    <Input
                      value={firstName}
                      onChange={(event) => {
                        setFirstName(event.target.value);
                      }}
                      aria-label="First name"
                      placeholder="First name"
                    />
                    <Input
                      value={lastName}
                      onChange={(event) => {
                        setLastName(event.target.value);
                      }}
                      aria-label="Last name"
                      placeholder="Last name"
                    />
                    <Input
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                      }}
                      aria-label="Email"
                      placeholder="Email"
                    />
                    <Input
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                      }}
                      aria-label="Phone"
                      placeholder="Phone"
                    />
                  </div>
                  <Button size="sm" disabled={saving} onClick={() => void saveProfile()}>
                    Save student profile
                  </Button>

                  <p className="text-small text-muted-foreground">Progress: {progressLabel}</p>

                  <div className="grid gap-4 tablet:grid-cols-2">
                    <Stat label="Enrollments" value={activity?.enrollments.length ?? 0} />
                    <Stat label="Attendance" value={activity?.attendance.length ?? 0} />
                    <Stat label="Submissions" value={activity?.submissions.length ?? 0} />
                    <Stat label="Certificates" value={activity?.certificates.length ?? 0} />
                  </div>

                  <List
                    title="Enrollments"
                    items={(activity?.enrollments ?? []).map(
                      (item) => `${item.courseTitle} · ${item.batchName} · ${item.status}`,
                    )}
                    empty="No enrollments"
                  />
                  <List
                    title="Attendance"
                    items={(activity?.attendance ?? []).map(
                      (item) => `${item.detail} · ${item.status}`,
                    )}
                    empty="No attendance records"
                  />
                  <List
                    title="Assignments / Submissions"
                    items={(activity?.submissions ?? []).map(
                      (item) => `${item.title} · ${item.status}`,
                    )}
                    empty="No submissions"
                  />
                  <List
                    title="Certificates"
                    items={(activity?.certificates ?? []).map(
                      (item) => `${item.courseTitle} · ${item.status}`,
                    )}
                    empty="No certificates"
                  />
                  <List
                    title="Activity"
                    items={[
                      selected.lastLoginAt
                        ? `Last login ${new Date(selected.lastLoginAt).toLocaleString()}`
                        : 'No login recorded',
                      `Membership ${selected.membership.status}`,
                      `Account ${selected.isActive ? 'active' : 'inactive'}`,
                    ]}
                    empty="No activity"
                  />
                </>
              ) : (
                <p className="text-small text-muted-foreground">Select a student to continue.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader className="pb-2">
        <p className="text-caption text-muted-foreground">{label}</p>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function List({
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

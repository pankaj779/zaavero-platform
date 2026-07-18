'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StudentApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import type { StudentAttendanceRecordDto } from '../../../lib/student';
import {
  StudentAttendanceCollection,
  StudentAttendanceFilters,
  StudentAttendanceStats,
} from './attendance-parts';
import { studentAttendancePageCopy } from './copy';
import {
  filterStudentAttendance,
  requireOrganizationId,
  sortStudentAttendance,
  toAttendanceApiStatus,
  type StudentAttendanceSortOption,
  type StudentAttendanceStatusFilter,
  type StudentViewState,
} from './filters';
import {
  StudentModuleEmptyState,
  StudentModuleErrorState,
  StudentModuleHeader,
  StudentModuleSkeleton,
  StudentPaginationBar,
} from './shared';

const LIST_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 300;

export function StudentAttendanceView({
  initialRecords,
  initialViewState,
  initialSummary,
}: {
  initialRecords?: StudentAttendanceRecordDto[];
  initialViewState?: StudentViewState;
  initialSummary?: {
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    attendancePercent: number | null;
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const copy = studentAttendancePageCopy;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<StudentAttendanceStatusFilter>('all');
  const [sort, setSort] = useState<StudentAttendanceSortOption>('session_date');
  const [courseId, setCourseId] = useState('all');
  const [batchId, setBatchId] = useState('all');
  const [liveSessionId, setLiveSessionId] = useState('all');
  const [page, setPage] = useState(1);

  const [viewState, setViewState] = useState<StudentViewState>(initialViewState ?? 'loading');
  const [records, setRecords] = useState<StudentAttendanceRecordDto[]>(initialRecords ?? []);
  const [presentCount, setPresentCount] = useState(initialSummary?.presentCount ?? 0);
  const [absentCount, setAbsentCount] = useState(initialSummary?.absentCount ?? 0);
  const [lateCount, setLateCount] = useState(initialSummary?.lateCount ?? 0);
  const [excusedCount, setExcusedCount] = useState(initialSummary?.excusedCount ?? 0);
  const [attendancePercent, setAttendancePercent] = useState<number | null>(
    initialSummary?.attendancePercent ?? null,
  );
  const [meta, setMeta] = useState(
    initialSummary?.meta ?? { total: 0, page: 1, limit: LIST_LIMIT, totalPages: 0 },
  );
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Courses' },
  ]);
  const [batchOptions, setBatchOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Batches' },
  ]);
  const [sessionOptions, setSessionOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Live Sessions' },
  ]);
  const hasLoadedRef = useRef(initialViewState !== undefined);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      const organizationId = requireOrganizationId(primaryOrganizationId);
      const sortBy =
        sort === 'status' ? 'status' : sort === 'recently_marked' ? 'markedAt' : 'markedAt';
      const sortOrder = sort === 'session_date' ? 'desc' : 'desc';

      const [listResult, statsResult] = await Promise.all([
        StudentApi.getAttendance({
          organizationId,
          status: toAttendanceApiStatus(status),
          liveSessionId: liveSessionId === 'all' ? undefined : liveSessionId,
          page,
          limit: LIST_LIMIT,
          sortBy,
          sortOrder,
        }),
        StudentApi.getAttendance({
          organizationId,
          page: 1,
          limit: 100,
          sortBy: 'markedAt',
          sortOrder: 'desc',
        }),
      ]);

      if (signal.aborted) {
        return;
      }

      setRecords(listResult.records);
      setMeta(listResult.meta);
      setPresentCount(statsResult.presentCount);
      setAbsentCount(statsResult.absentCount);
      setLateCount(statsResult.lateCount);
      setExcusedCount(statsResult.excusedCount);
      setAttendancePercent(statsResult.attendancePercent);

      const courses = new Map<string, string>();
      const batches = new Map<string, string>();
      const sessions = new Map<string, string>();
      for (const record of statsResult.records) {
        if (record.session.course.id) {
          courses.set(record.session.course.id, record.session.course.title);
        }
        batches.set(record.session.batch.id, record.session.batch.name);
        sessions.set(record.liveSessionId, record.session.title);
      }
      setCourseOptions([
        { value: 'all', label: 'All Courses' },
        ...[...courses.entries()].map(([value, label]) => ({ value, label })),
      ]);
      setBatchOptions([
        { value: 'all', label: 'All Batches' },
        ...[...batches.entries()].map(([value, label]) => ({ value, label })),
      ]);
      setSessionOptions([
        { value: 'all', label: 'All Live Sessions' },
        ...[...sessions.entries()].map(([value, label]) => ({ value, label })),
      ]);

      const filtersActive =
        debouncedQuery.trim().length > 0 ||
        status !== 'all' ||
        courseId !== 'all' ||
        batchId !== 'all' ||
        liveSessionId !== 'all';

      if (listResult.records.length === 0 && !filtersActive && listResult.meta.total === 0) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [batchId, courseId, debouncedQuery, liveSessionId, page, primaryOrganizationId, sort, status],
  );

  useEffect(() => {
    if (initialViewState !== undefined && initialRecords !== undefined) {
      return;
    }

    const controller = new AbortController();
    if (!hasLoadedRef.current) {
      setViewState('loading');
    }

    void (async () => {
      try {
        await loadList(controller.signal);
        hasLoadedRef.current = true;
      } catch {
        if (!controller.signal.aborted) {
          setViewState('error');
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [initialRecords, initialViewState, loadList, reloadKey]);

  const visibleRecords = useMemo(() => {
    const filtered = filterStudentAttendance(records, debouncedQuery, status, {
      courseId,
      batchId,
      liveSessionId,
    });
    return sortStudentAttendance(filtered, sort);
  }, [batchId, courseId, debouncedQuery, liveSessionId, records, sort, status]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title={copy.title} description={copy.description} />
        <StudentModuleSkeleton label="Loading Attendance" />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title={copy.title} description={copy.description} />
        <StudentModuleErrorState
          title={copy.errorTitle}
          description={copy.errorDescription}
          onRetry={() => {
            setReloadKey((value) => value + 1);
          }}
        />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title={copy.title} description={copy.description} />
        <StudentModuleEmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StudentModuleHeader title={copy.title} description={copy.description} />
      <StudentAttendanceStats
        presentCount={presentCount}
        absentCount={absentCount}
        lateCount={lateCount}
        excusedCount={excusedCount}
        attendancePercent={attendancePercent}
      />
      <StudentAttendanceFilters
        query={query}
        status={status}
        sort={sort}
        courseId={courseId}
        batchId={batchId}
        liveSessionId={liveSessionId}
        courseOptions={courseOptions}
        batchOptions={batchOptions}
        sessionOptions={sessionOptions}
        onQueryChange={setQuery}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onSortChange={(value) => {
          setSort(value);
          setPage(1);
        }}
        onCourseChange={(value) => {
          setCourseId(value);
          setPage(1);
        }}
        onBatchChange={(value) => {
          setBatchId(value);
          setPage(1);
        }}
        onSessionChange={(value) => {
          setLiveSessionId(value);
          setPage(1);
        }}
      />
      <StudentAttendanceCollection records={visibleRecords} />
      <StudentPaginationBar
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        label={copy.paginationLabel}
        onPageChange={setPage}
      />
    </div>
  );
}

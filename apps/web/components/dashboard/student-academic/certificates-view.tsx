'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StudentApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import type { StudentCertificateDto } from '../../../lib/student';
import {
  StudentCertificateCollection,
  StudentCertificateDetails,
  StudentCertificateFilters,
  StudentCertificateStats,
} from './certificate-parts';
import { studentCertificatesPageCopy } from './copy';
import {
  deriveStudentCertificateStats,
  filterStudentCertificates,
  requireOrganizationId,
  sortStudentCertificates,
  toCertificateApiStatus,
  type StudentCertificateSortOption,
  type StudentCertificateStatusFilter,
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

export function StudentCertificatesView({
  initialCertificates,
  initialViewState,
  initialMeta,
}: {
  initialCertificates?: StudentCertificateDto[];
  initialViewState?: StudentViewState;
  initialMeta?: { total: number; page: number; limit: number; totalPages: number };
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const copy = studentCertificatesPageCopy;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<StudentCertificateStatusFilter>('all');
  const [sort, setSort] = useState<StudentCertificateSortOption>('newest');
  const [courseId, setCourseId] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [viewState, setViewState] = useState<StudentViewState>(initialViewState ?? 'loading');
  const [certificates, setCertificates] = useState<StudentCertificateDto[]>(
    initialCertificates ?? [],
  );
  const [statsCertificates, setStatsCertificates] = useState<StudentCertificateDto[]>(
    initialCertificates ?? [],
  );
  const [meta, setMeta] = useState(
    initialMeta ?? { total: 0, page: 1, limit: LIST_LIMIT, totalPages: 0 },
  );
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Courses' },
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
      const sortBy = sort === 'course' ? 'updatedAt' : sort === 'status' ? 'status' : 'updatedAt';
      const sortOrder = 'desc';

      const searchLooksLikeCertNumber =
        debouncedQuery.trim().length > 0 &&
        /^[A-Za-z0-9-]{3,}$/.test(debouncedQuery.trim()) &&
        !debouncedQuery.includes(' ');

      const [listResult, statsResult] = await Promise.all([
        StudentApi.getCertificates({
          organizationId,
          status: toCertificateApiStatus(status),
          search: searchLooksLikeCertNumber ? debouncedQuery.trim() : undefined,
          page,
          limit: LIST_LIMIT,
          sortBy,
          sortOrder,
        }),
        StudentApi.getCertificates({
          organizationId,
          page: 1,
          limit: 100,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        }),
      ]);

      if (signal.aborted) {
        return;
      }

      setCertificates(listResult.items);
      setMeta(listResult.meta);
      setStatsCertificates(statsResult.items);

      const courses = new Map<string, string>();
      for (const certificate of statsResult.items) {
        courses.set(certificate.course.id, certificate.course.title);
      }
      setCourseOptions([
        { value: 'all', label: 'All Courses' },
        ...[...courses.entries()].map(([value, label]) => ({ value, label })),
      ]);

      const filtersActive =
        debouncedQuery.trim().length > 0 || status !== 'all' || courseId !== 'all';

      if (listResult.items.length === 0 && !filtersActive && listResult.meta.total === 0) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [courseId, debouncedQuery, page, primaryOrganizationId, sort, status],
  );

  useEffect(() => {
    if (initialViewState !== undefined && initialCertificates !== undefined) {
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
  }, [initialCertificates, initialViewState, loadList, reloadKey]);

  const visibleCertificates = useMemo(() => {
    const filtered = filterStudentCertificates(certificates, debouncedQuery, status, {
      courseId,
    });
    return sortStudentCertificates(filtered, sort);
  }, [certificates, courseId, debouncedQuery, sort, status]);

  const selectedCertificate =
    selectedId === null
      ? null
      : (visibleCertificates.find((item) => item.id === selectedId) ?? null);

  const stats = useMemo(
    () => deriveStudentCertificateStats(statsCertificates),
    [statsCertificates],
  );

  async function handleVerify(verificationCode: string): Promise<StudentCertificateDto> {
    return StudentApi.verifyCertificate(verificationCode);
  }

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title={copy.title} description={copy.description} />
        <StudentModuleSkeleton label="Loading Certificates" />
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
      <StudentCertificateStats stats={stats} />
      <StudentCertificateFilters
        query={query}
        status={status}
        sort={sort}
        courseId={courseId}
        courseOptions={courseOptions}
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
      />
      {selectedCertificate ? (
        <StudentCertificateDetails
          certificate={selectedCertificate}
          onClose={() => {
            setSelectedId(null);
          }}
          onVerify={handleVerify}
        />
      ) : null}
      <StudentCertificateCollection
        certificates={visibleCertificates}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
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
